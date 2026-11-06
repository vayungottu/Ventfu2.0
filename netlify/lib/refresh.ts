import { and, eq, lt, sql } from "drizzle-orm"
import { db } from "../../db/index.js"
import { events, refreshLog } from "../../db/schema.js"
import {
  HYDERABAD,
  TODAY_TARGET,
  UPCOMING_TARGET,
  UPCOMING_WINDOW_DAYS,
  dedupe,
  localDate,
  searchGroqEvents,
  searchTicketmaster,
  type CollectedEvent,
} from "./events.js"

const MIN_GAP_MS = 3 * 60 * 60 * 1000 // don't re-run a successful refresh more than every 3h
const STUCK_MS = 20 * 60 * 1000 // a run that never finished is considered dead after 20 min

export async function lastRefresh(city = HYDERABAD.city) {
  const [row] = await db.select().from(refreshLog).where(eq(refreshLog.city, city))
  return row
}

/** Atomically claims the refresh slot; returns false if another/recent run makes this one unnecessary. */
async function claim(city: string) {
  const now = new Date()
  const rows = await db
    .insert(refreshLog)
    .values({ city, startedAt: now, finishedAt: null, summary: "running" })
    .onConflictDoUpdate({
      target: refreshLog.city,
      set: { startedAt: now, finishedAt: null, summary: "running" },
      setWhere: sql`(${refreshLog.finishedAt} IS NOT NULL AND ${refreshLog.startedAt} < ${new Date(now.getTime() - MIN_GAP_MS)})
        OR (${refreshLog.finishedAt} IS NULL AND ${refreshLog.startedAt} < ${new Date(now.getTime() - STUCK_MS)})
        OR ${refreshLog.summary} LIKE 'failed%'`,
    })
    .returning()
  return rows.length > 0
}

async function fillWithGroq(pool: CollectedEvent[], target: number, base: Omit<Parameters<typeof searchGroqEvents>[0], "exclude" | "count">[], log: string[]) {
  for (const search of base) {
    if (pool.length >= target) break
    try {
      const found = await searchGroqEvents({ ...search, count: Math.min(15, target - pool.length + 4), exclude: pool.map((event) => event.title) })
      pool.splice(0, pool.length, ...dedupe([...pool, ...found]))
      log.push(`groq(${search.focus.slice(0, 24)}…): +${found.length}`)
    } catch (error) {
      log.push(`groq error: ${(error as Error).message.slice(0, 120)}`)
    }
  }
}

export async function refreshHyderabad({ force = false } = {}) {
  const city = HYDERABAD.city
  if (!force && !(await claim(city))) return { skipped: true }
  if (force) await db.insert(refreshLog).values({ city, startedAt: new Date(), summary: "running" }).onConflictDoUpdate({ target: refreshLog.city, set: { startedAt: new Date(), finishedAt: null, summary: "running" } })

  const log: string[] = []
  try {
    const today = localDate(HYDERABAD.timeZone)
    const tomorrow = localDate(HYDERABAD.timeZone, 1)
    const windowEnd = localDate(HYDERABAD.timeZone, UPCOMING_WINDOW_DAYS)

    // 1. Ticketmaster first (structured, reliable data, but sparse coverage in India).
    const tm = await searchTicketmaster({ lat: HYDERABAD.lat, lng: HYDERABAD.lng, startDate: today, endDate: windowEnd, size: 120 })
    log.push(`ticketmaster: ${tm.length}`)
    const todayPool = dedupe(tm.filter((event) => event.date === today))
    const upcomingPool = dedupe(tm.filter((event) => event.date >= tomorrow))

    // 2. Groq web research to reach the targets.
    await fillWithGroq(todayPool, TODAY_TARGET, [
      { city: HYDERABAD.name, startDate: today, endDate: today, focus: "concerts, live music, DJ nights, stand-up comedy and theatre happening today" },
      { city: HYDERABAD.name, startDate: today, endDate: today, focus: "workshops, art exhibitions, food events, markets, sports screenings, meetups and family activities happening today" },
      { city: HYDERABAD.name, startDate: today, endDate: today, focus: "any other public events, gigs or experiences happening today in Hyderabad and Secunderabad" },
    ], log)

    const upcomingSearches = [
      "concerts, live music, DJ nights and music festivals",
      "stand-up comedy, theatre, dance performances and film screenings",
      "art exhibitions, workshops, food festivals, flea markets and pop-ups",
      "sports, marathons, tech meetups, conferences, cultural festivals and family events",
      "any other popular upcoming public events and experiences",
    ].map((focus) => ({ city: HYDERABAD.name, startDate: tomorrow, endDate: windowEnd, focus }))
    await fillWithGroq(upcomingPool, UPCOMING_TARGET, upcomingSearches, log)

    const chosen = [
      ...todayPool.slice(0, TODAY_TARGET),
      ...upcomingPool.sort((a, b) => a.date.localeCompare(b.date)).slice(0, UPCOMING_TARGET),
    ]

    // 3. Save. Past events are removed; if this run found a healthy set, it replaces the old list.
    await db.delete(events).where(and(eq(events.city, city), lt(events.date, today)))
    if (chosen.length >= 10) {
      const keep = chosen.map((event) => event.id)
      await db.delete(events).where(and(eq(events.city, city), sql`${events.id} NOT IN (${sql.join(keep.map((id) => sql`${id}`), sql`, `)})`))
    }
    if (chosen.length) {
      const now = new Date()
      await db
        .insert(events)
        .values(chosen.map((event) => ({ ...event, city, updatedAt: now })))
        .onConflictDoUpdate({
          target: events.id,
          set: {
            title: sql`excluded.title`, date: sql`excluded.date`, time: sql`excluded.time`, venue: sql`excluded.venue`,
            area: sql`excluded.area`, category: sql`excluded.category`, price: sql`excluded.price`,
            description: sql`excluded.description`, imageUrl: sql`excluded.image_url`, sourceUrl: sql`excluded.source_url`,
            source: sql`excluded.source`, updatedAt: now,
          },
        })
    }

    const summary = `today ${Math.min(todayPool.length, TODAY_TARGET)}/${TODAY_TARGET}, upcoming ${Math.min(upcomingPool.length, UPCOMING_TARGET)}/${UPCOMING_TARGET} | ${log.join(" | ")}`.slice(0, 1000)
    await db.update(refreshLog).set({ finishedAt: new Date(), summary }).where(eq(refreshLog.city, city))
    console.log("Hyderabad refresh:", summary)
    return { skipped: false, summary }
  } catch (error) {
    const summary = `failed: ${(error as Error).message} | ${log.join(" | ")}`.slice(0, 1000)
    await db.update(refreshLog).set({ finishedAt: new Date(), summary }).where(eq(refreshLog.city, city))
    console.error("Hyderabad refresh failed", error)
    return { skipped: false, summary }
  }
}

