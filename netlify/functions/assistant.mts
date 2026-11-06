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

const line = (event: Pick<CollectedEvent, "title" | "date" | "time" | "venue" | "price" | "category" | "sourceUrl">) =>
  `- ${event.title} | ${event.date} ${event.time} | ${event.venue} | ${event.category} | ${event.price} | ${event.sourceUrl}`

async function gatherResearch(location: string, message: string) {
  const sections: string[] = []
  const today = localDate(HYDERABAD.timeZone)
  const endDate = localDate(HYDERABAD.timeZone, 45)

  const tasks: Promise<void>[] = []

  if (isHyderabad(location)) {
    tasks.push(
      db
        .select()
        .from(events)
        .where(and(eq(events.city, HYDERABAD.city), gte(events.date, today)))
        .orderBy(asc(events.date))
        .limit(45)
        .then((rows) => {
          if (rows.length) sections.push(`Ventful database — Hyderabad events:\n${rows.map(line).join("\n")}`)
        })
        .catch((error) => console.error("DB research failed", error)),
    )

    const displayed = fallbackEvents
      .filter((event) => event.date >= today && event.date <= endDate)
      .map(line)
    if (displayed.length) sections.push(`Ventful Discover — curated events currently shown in the app:\n${displayed.join("\n")}`)
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
    }),
  )
  if (keyword) {
    tasks.push(
      searchTicketmaster({ ...where, keyword, startDate: today, endDate, size: 10 }).then((found) => {
        if (found.length) sections.push(`Ticketmaster — matches for "${keyword}":\n${found.map(line).join("\n")}`)
      }),
    )
  }

  await Promise.all(tasks)
  return sections.join("\n\n")
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

  try {
    const research = await gatherResearch(location, message)
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
    return json({ reply: reply || "I couldn't find events for that right now. Try asking another way." })
  } catch (error) {
    console.error("Assistant failure", error)
    return json({ reply: "I couldn't reach the event search right now. Please try again in a moment." }, 502)
  }
}

export const config: Config = { path: "/api/assistant" }
