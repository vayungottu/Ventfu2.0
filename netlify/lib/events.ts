// Shared helpers for collecting real events from Ticketmaster and Groq web search.

export type CollectedEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD (local to the event's city)
  time: string
  venue: string
  area: string
  category: string
  price: string
  description: string
  imageUrl: string
  sourceUrl: string
  source: "ticketmaster" | "groq"
}

export const HYDERABAD = { city: "Hyderabad, India", name: "Hyderabad", lat: 17.385, lng: 78.4867, timeZone: "Asia/Kolkata" }

export const TODAY_TARGET = 10
export const UPCOMING_TARGET = 30
export const UPCOMING_WINDOW_DAYS = 45

const APP_CATEGORIES = ["Music", "Art", "Comedy", "Dance", "Festivals", "Food", "Film"]

export function isHyderabad(location: string | null | undefined) {
  if (!location) return false
  if (/hyderabad|secunderabad/i.test(location)) return true
  const match = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (!match) return false
  const [lat, lng] = [Number(match[1]), Number(match[2])]
  return Math.abs(lat - HYDERABAD.lat) < 0.6 && Math.abs(lng - HYDERABAD.lng) < 0.6
}

export function localDate(timeZone = HYDERABAD.timeZone, offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
}

function prettyDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
}

export function mapCategory(...hints: Array<string | undefined | null>) {
  const text = hints.filter(Boolean).join(" ").toLowerCase()
  if (/comedy|stand-?up|improv|open mic/.test(text)) return "Comedy"
  if (/film|movie|cinema|screening/.test(text)) return "Film"
  if (/dance|salsa|bachata|garba|ballet|kathak|bharatanatyam/.test(text)) return "Dance"
  if (/food|culinary|brunch|wine|beer|tasting|cook|market|bazaar/.test(text)) return "Food"
  if (/festival|fest\b|mela|fair|carnival|diwali|celebration/.test(text)) return "Festivals"
  if (/art|exhibit|gallery|paint|theatre|theater|play|craft|workshop|photograph|poetry/.test(text)) return "Art"
  if (/music|concert|gig|live|dj|band|singer|rock|jazz|edm|classical|indie|karaoke/.test(text)) return "Music"
  const direct = APP_CATEGORIES.find((category) => text.includes(category.toLowerCase()))
  return direct || "Event"
}

export function eventKey(title: string, date: string) {
  return `${date}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160)
}

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : ""
}

function formatTime(value: string | undefined) {
  if (!value) return "Time TBA"
  const [h, m] = value.split(":").map(Number)
  if (Number.isNaN(h)) return "Time TBA"
  const suffix = h >= 12 ? "PM" : "AM"
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${suffix}`
}

// ---------------------------------------------------------------- Ticketmaster

type TicketmasterQuery = { lat?: number; lng?: number; city?: string; keyword?: string; startDate: string; endDate: string; size?: number }

export async function searchTicketmaster(query: TicketmasterQuery): Promise<CollectedEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) return []
  const params = new URLSearchParams({
    apikey: apiKey,
    startDateTime: `${query.startDate}T00:00:00Z`,
    endDateTime: `${query.endDate}T23:59:59Z`,
    size: String(query.size ?? 100),
    sort: "date,asc",
    includeTBA: "no",
    includeTBD: "no",
  })
  if (query.lat !== undefined && query.lng !== undefined) {
    params.set("latlong", `${query.lat},${query.lng}`)
    params.set("radius", "60")
    params.set("unit", "km")
  } else if (query.city) {
    params.set("city", query.city)
  }
  if (query.keyword) params.set("keyword", query.keyword)

  try {
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`, { signal: AbortSignal.timeout(12000) })
    if (!response.ok) {
      console.error("Ticketmaster error", response.status)
      return []
    }
    const data: any = await response.json()
    const items: any[] = data?._embedded?.events || []
    return items
      .map((item): CollectedEvent | null => {
        const date = item?.dates?.start?.localDate
        if (!item?.name || !date) return null
        const venue = item?._embedded?.venues?.[0]
        const classification = item?.classifications?.[0]
        const priceRange = item?.priceRanges?.[0]
        const image = [...(item.images || [])].sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0]
        const price = priceRange
          ? priceRange.min === 0 && !priceRange.max
            ? "Free"
            : `${priceRange.currency || ""} ${priceRange.min}${priceRange.max && priceRange.max !== priceRange.min ? `–${priceRange.max}` : ""}`.trim()
          : "See tickets"
        return {
          id: `tm-${item.id}`,
          title: clean(item.name, 200),
          date,
          time: formatTime(item?.dates?.start?.localTime),
          venue: clean(venue?.name) || "Venue TBA",
          area: clean(venue?.city?.name),
          category: mapCategory(classification?.segment?.name, classification?.genre?.name, item.name),
          price,
          description: clean(item.info || item.pleaseNote || `${classification?.genre?.name || "Live event"} at ${venue?.name || "the venue"}.`, 600),
          imageUrl: image?.url || "",
          sourceUrl: item.url || "",
          source: "ticketmaster",
        }
      })
      .filter((event): event is CollectedEvent => Boolean(event))
  } catch (error) {
    console.error("Ticketmaster request failed", error)
    return []
  }
}

// ---------------------------------------------------------------- Groq

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
export const GROQ_MODEL = "openai/gpt-oss-120b"

export async function callGroq(body: Record<string, unknown>, { retries = 0, timeoutMs = 55000 } = {}): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY missing")
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: GROQ_MODEL, ...body }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data: any = await response.json().catch(() => ({}))
    if (response.ok) return data
    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      const wait = Math.min(Number(response.headers.get("retry-after")) || 15, 60)
      console.warn(`Groq ${response.status}, retrying in ${wait}s`)
      await new Promise((resolve) => setTimeout(resolve, wait * 1000))
      continue
    }
    throw new Error(`Groq ${response.status}: ${data?.error?.message || "request failed"}`)
  }
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf("{")
  const end = candidate.lastIndexOf("}")
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    return null
  }
}

type GroqSearch = { city: string; startDate: string; endDate: string; count: number; focus: string; exclude: string[] }

export async function searchGroqEvents(search: GroqSearch): Promise<CollectedEvent[]> {
  const sameDay = search.startDate === search.endDate
  const when = sameDay ? `on ${prettyDate(search.startDate)} (${search.startDate})` : `between ${prettyDate(search.startDate)} and ${prettyDate(search.endDate)}`
  const prompt = [
    `Use browser_search to find ${search.count} real public events happening in ${search.city} ${when}.`,
    `Focus on: ${search.focus}.`,
    "Good sources: district.in, insider.in, bookmyshow.com, allevents.in, skillboxes.com, highape.com, venue and organiser websites.",
    "Only include events you actually found on a web page during this search, with a link to that event's own page. Never invent events, dates or links. Skip adult/explicit events.",
    search.exclude.length ? `Do not repeat these already-known events: ${search.exclude.slice(0, 60).join("; ")}.` : "",
    "Reply with ONLY a JSON object, no other text, in this exact shape:",
    '{"events":[{"title":"","date":"YYYY-MM-DD","time":"7:00 PM","venue":"","area":"neighbourhood","category":"Music|Art|Comedy|Dance|Festivals|Food|Film|Sports|Tech|Workshop","price":"₹499 or Free","description":"one sentence","url":"https://..."}]}',
  ]
    .filter(Boolean)
    .join("\n")

  const data = await callGroq(
    {
      tools: [{ type: "browser_search" }],
      temperature: 0.2,
      max_completion_tokens: 8000,
      messages: [
        { role: "system", content: `You are an events researcher. Today is ${prettyDate(localDate())}. You output strict JSON.` },
        { role: "user", content: prompt },
      ],
    },
    { retries: 3, timeoutMs: 120000 },
  )

  const parsed = extractJson(data?.choices?.[0]?.message?.content || "")
  const raw: any[] = Array.isArray(parsed?.events) ? parsed.events : []
  return raw
    .map((item): CollectedEvent | null => {
      const title = clean(item?.title, 200)
      const date = clean(item?.date, 10)
      const url = clean(item?.url, 500)
      if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
      if (date < search.startDate || date > search.endDate) return null
      if (!/^https?:\/\//.test(url)) return null
      return {
        id: `groq-${eventKey(title, date)}`,
        title,
        date,
        time: clean(item?.time, 40) || "Time TBA",
        venue: clean(item?.venue) || "Venue TBA",
        area: clean(item?.area, 80),
        category: mapCategory(item?.category, title, item?.description),
        price: clean(item?.price, 60) || "Price TBA",
        description: clean(item?.description, 600) || "Details from the organiser.",
        imageUrl: "",
        sourceUrl: url,
        source: "groq",
      }
    })
    .filter((event): event is CollectedEvent => Boolean(event))
}

export function dedupe(events: CollectedEvent[]) {
  const seen = new Set<string>()
  return events.filter((event) => {
    const key = eventKey(event.title.replace(/\b(hyderabad|live|tickets?)\b/gi, ""), event.date)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
