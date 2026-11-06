import type { Config } from "@netlify/functions"
import { and, asc, eq, gte } from "drizzle-orm"
import { db } from "../../db/index.js"
import { events } from "../../db/schema.js"
import { HYDERABAD, callGroq, isHyderabad, localDate, searchTicketmaster, type CollectedEvent } from "../lib/events.js"
import { fallbackEvents } from "../lib/fallback-events.mjs"

const SYSTEM_PROMPT = `You are Venty, the friendly event discovery assistant inside the Ventful app.
You receive Ventful's currently displayed events below: database events, curated fallback events, and live Ticketmaster results. Treat all of these as the app's current event inventory and prefer them when answering.
If they do not answer the question, use browser_search to find more real upcoming public events (district.in, insider.in, bookmyshow.com, allevents.in, venue sites).
For each recommendation give the name, date, time, venue, price if known, and the event's own link. Never invent events or links.
Keep answers short and mobile-friendly: plain text, short lines, simple "- " bullets, no markdown tables or headings. Exclude adult or explicit events.`

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } })

type DisplayedEvent = Pick<CollectedEvent, "title" | "date" | "time" | "venue" | "price" | "category" | "sourceUrl"> & { description?: string | null; area?: string | null }

const line = (event: DisplayedEvent) =>
  `- ${event.title} | ${event.date} ${event.time} | ${event.venue} | ${event.category} | ${event.price} | ${event.sourceUrl}`

const detail = (event: DisplayedEvent) =>
  `${event.title}\n- Date: ${event.date}\n- Time: ${event.time}\n- Venue: ${event.venue}${event.area ? `, ${event.area}` : ""}\n- Category: ${event.category}\n- Price: ${event.price}\n- Details: ${event.description || "See the event page for full details."}\n- Link: ${event.sourceUrl}`

function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function scoreEvent(event: DisplayedEvent, message: string) {
  const query = normalise(message)
  const title = normalise(event.title)
  const words = query.split(" ").filter((word) => word.length > 2)
  return words.reduce((score, word) => score + (title.includes(word) ? 2 : 0), 0) + (query.includes(title) ? 10 : 0)
}

function offlineAnswer(message: string, inventory: DisplayedEvent[]) {
  const ranked = inventory
    .map((event) => ({ event, score: scoreEvent(event, message) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (!ranked.length) {
    const soon = inventory.slice(0, 3)
    return `I can help with the events currently shown in Ventful, but live AI search is temporarily unavailable.\n\nHere are some upcoming options:\n\n${soon.map(detail).join("\n\n")}`
  }

  return `Here’s what I found in Ventful’s current events:\n\n${ranked.map((item) => detail(item.event)).join("\n\n")}\n\nLive AI search is temporarily unavailable, so this answer uses the events displayed in the app.`
}

async function gatherResearch(location: string, message: string) {
  const sections: string[] = []
  const today = localDate(HYDERABAD.timeZone)
  const endDate = localDate(HYDERABAD.timeZone, 45)

  const tasks: Promise<void>[] = []
  const inventory: DisplayedEvent[] = []

  if (isHyderabad(location)) {
    tasks.push(
      db
        .select()
        .from(events)
        .where(and(eq(events.city, HYDERABAD.city), gte(events.date, today)))
        .orderBy(asc(events.date))
        .limit(45)
        .then((rows) => {
          if (rows.length) {
            sections.push(`Ventful database — Hyderabad events:\n${rows.map(line).join("\n")}`)
            inventory.push(...rows)
          }
        })
        .catch((error) => console.error("DB research failed", error)),
    )

    const displayed = fallbackEvents.filter((event) => event.date >= today && event.date <= endDate)
    if (displayed.length) {
      sections.push(`Ventful Discover — curated events currently shown in the app:\n${displayed.map(line).join("\n")}`)
      inventory.push(...displayed)
    }
  }

  const coords = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  const where = isHyderabad(location)
    ? { lat: HYDERABAD.lat, lng: HYDERABAD.lng }
    : coords
      ? { lat: Number(coords[1]), lng: Number(coords[2]) }
      : { city: location.split(",")[0].trim() }
  const keyword = message.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((word) => word.length > 3 && !/^(what|events?|this|that|with|near|today|tomorrow|weekend|there|where|when|which|some|show|find|anything|happening|going|about|upcoming)$/i.test(word))[0]

  tasks.push(
    searchTicketmaster({ ...where, startDate: today, endDate, size: 25 }).then((found) => {
      sections.push(found.length ? `Ticketmaster — events near ${location}:\n${found.map(line).join("\n")}` : `Ticketmaster returned no events near ${location}.`)
      inventory.push(...found)
    }).catch((error) => console.error("Ticketmaster research failed", error)),
  )
  if (keyword) {
    tasks.push(
      searchTicketmaster({ ...where, keyword, startDate: today, endDate, size: 10 }).then((found) => {
        if (found.length) {
          sections.push(`Ticketmaster — matches for "${keyword}":\n${found.map(line).join("\n")}`)
          inventory.push(...found)
        }
      }).catch((error) => console.error("Ticketmaster keyword research failed", error)),
    )
  }

  await Promise.all(tasks)
  return { research: sections.join("\n\n"), inventory }
}

export default async (request: Request) => {
  if (request.method !== "POST") return json({ reply: "Use POST." }, 405)
  if (!process.env.GROQ_API_KEY) return json({ reply: "The assistant isn't configured yet — the Groq API key is missing on the server." }, 500)

  let payload: any = {}
  try {
    payload = await request.json()
  } catch {
    return json({ reply: "Invalid request." }, 400)
  }

  const location = String(payload.location || HYDERABAD.city).slice(0, 120)
  const message = String(payload.message || "What events are coming up?").slice(0, 2000)
  const history = Array.isArray(payload.history)
    ? payload.history
        .filter((item: any) => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
        .slice(-10)
        .map((item: any) => ({ role: item.role, content: item.text.slice(0, 2000) }))
    : []

  const { research, inventory } = await gatherResearch(location, message)

  try {
    const data = await callGroq(
      {
        tools: [{ type: "browser_search" }],
        temperature: 0.4,
        max_completion_tokens: 2500,
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n\nToday is ${localDate(HYDERABAD.timeZone)}. The user's selected location is ${location}.\n\n${research || "No pre-loaded research available."}`,
          },
          ...history,
          { role: "user", content: message },
        ],
      },
      { retries: 1, timeoutMs: 45000 },
    )
    const reply = data?.choices?.[0]?.message?.content?.trim()
    return json({ reply: reply || offlineAnswer(message, inventory) })
  } catch (error) {
    console.error("Assistant failure; using displayed-event fallback", error)
    return json({ reply: offlineAnswer(message, inventory) })
  }
}

export const config: Config = { path: "/api/assistant" }
