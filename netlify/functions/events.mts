import { asc, and, eq, gte } from "drizzle-orm"
import { db } from "../../db/index.js"
import { events } from "../../db/schema.js"
import { HYDERABAD, isHyderabad, localDate, searchTicketmaster, type CollectedEvent } from "../lib/events.js"
import { lastRefresh } from "../lib/refresh.js"

const STALE_MS = 12 * 60 * 60 * 1000

const json = (body: unknown, maxAge = 0) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": maxAge ? `public, max-age=${maxAge}` : "no-store" },
  })

const toClient = (event: Omit<CollectedEvent, "id"> & { id: string }) => ({
  id: event.id,
  title: event.title,
  date: event.date,
  time: event.time,
  venue: event.venue,
  area: event.area,
  category: event.category,
  price: event.price,
  description: event.description,
  imageUrl: event.imageUrl || undefined,
  sourceUrl: event.sourceUrl,
  source: event.source,
})

export default async (req: Request) => {
  const url = new URL(req.url)
  const location = url.searchParams.get("location") || HYDERABAD.city

  if (isHyderabad(location)) {
    const today = localDate(HYDERABAD.timeZone)
    const rows = await db
      .select()
      .from(events)
      .where(and(eq(events.city, HYDERABAD.city), gte(events.date, today)))
      .orderBy(asc(events.date), asc(events.time))

    const refresh = await lastRefresh()
    const hasToday = rows.some((row) => row.date === today)
    const finishedAt = refresh?.finishedAt?.getTime() || 0
    const stale = !refresh || !hasToday || Date.now() - finishedAt > STALE_MS
    const running = refresh && !refresh.finishedAt && Date.now() - refresh.startedAt.getTime() < 20 * 60 * 1000

    if (stale && !running) {
      // Fire-and-forget: the background function returns 202 immediately and throttles itself.
      await fetch(`${url.origin}/.netlify/functions/refresh-events`, { method: "POST", signal: AbortSignal.timeout(4000) }).catch(() => {})
    }

    return json({
      location: HYDERABAD.city,
      events: rows.map((row) => toClient({ ...row, source: row.source as CollectedEvent["source"] })),
      refreshing: Boolean(stale || running),
    })
  }

  // Other locations: live Ticketmaster lookup.
  const coords = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  const startDate = localDate("UTC")
  const endDate = localDate("UTC", 45)
  const found = coords
    ? await searchTicketmaster({ lat: Number(coords[1]), lng: Number(coords[2]), startDate, endDate, size: 60 })
    : await searchTicketmaster({ city: location.split(",")[0].trim(), startDate, endDate, size: 60 })
  return json({ location, events: found.map(toClient), refreshing: false }, 600)
}
