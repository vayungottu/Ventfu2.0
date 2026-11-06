import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { supabase } from "./supabaseClient"

type DateFilter = "Any day" | "Today" | "Tomorrow" | "This weekend"
type AppView = "explore" | "saved"

type SubmittedEvent = {
  id: string
  name: string
  venue: string
  dateTime: string
  ticketLink: string
  price: string
  socialLink: string
  mapsLink: string
  email: string
  status: string
}

type VentyEvent = {
  id: string
  day: string
  weekday: string
  month: string
  title: string
  venue: string
  area: string
  time: string
  endTime: string
  category: string
  image: string
  color: string
  dateGroup: DateFilter
  price: string
  description: string
  featured?: boolean
  soon?: boolean
  sourceUrl?: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const fallbackEvents: VentyEvent[] = [
  {
    id: "featured-hack",
    day: "14", weekday: "SAT", month: "NOV", title: "Venty Hack Weekend",
    venue: "Indiranagar", area: "Bengaluru", time: "9:00 AM", endTime: "9:00 PM",
    category: "Hackathon", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85",
    color: "#e8452c", dateGroup: "Any day", price: "Free", description: "Build something ridiculous in 36 hours.", featured: true,
  },
]

const categories = ["All", "Music", "Art", "Comedy", "Dance", "Festivals", "Food", "Film"]
const dateFilters: DateFilter[] = ["Any day", "Today", "Tomorrow", "This weekend"]

function Icon({ name, size = 20 }: { name: "arrow" | "bookmark" | "calendar" | "check" | "chevron" | "close" | "compass" | "location" | "plus" | "search" | "share" | "ticket"; size?: number }) {
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2 7.6 4.5" /></>,
    ticket: <path d="M3 8.5V5h18v3.5a3.5 3.5 0 0 0 0 7V19H3v-3.5a3.5 3.5 0 0 0 0-7ZM13 8v8" />,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>{paths[name]}</svg>
}

function dateGroupFor(date: Date): DateFilter {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((eventDay.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  const weekday = eventDay.getDay()
  const daysUntilWeekend = (6 - now.getDay() + 7) % 7
  if ((weekday === 0 || weekday === 6) && diff >= 0 && diff <= daysUntilWeekend + 1) return "This weekend"
  return "Any day"
}

function normaliseEvent(raw: any, index: number): VentyEvent | null {
  if (!raw?.title || !raw?.date) return null
  const date = new Date(`${raw.date}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return {
    id: String(raw.title + raw.date + raw.venue).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    day: String(date.getDate()).padStart(2, "0"),
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    title: raw.title,
    venue: raw.venue || "Venue TBA",
    area: raw.area || "",
    time: raw.time || "Time TBA",
    endTime: raw.endsAt ? new Date(raw.endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
    category: raw.category || "Event",
    image: raw.imageUrl || "https://placehold.co/900x600/171512/f4efe6/png?text=Event",
    color: ["#e8452c", "#1f2a5a", "#f1b82d", "#28766a", "#b25488", "#d3633a", "#2d6073"][index % 7],
    dateGroup: dateGroupFor(date),
    price: raw.price || "Price TBA",
    description: raw.description || raw.summary || "Details from the organizer.",
    soon: dateGroupFor(date) === "Today",
    sourceUrl: raw.sourceUrl || "",
  }
}

function EventCard({ event, isSaved, onOpen, onSave }: { event: VentyEvent; isSaved: boolean; onOpen: () => void; onSave: () => void }) {
  return (
    <article className="event-card">
      <button className="card-hit-area" type="button" onClick={onOpen} aria-label={`View ${event.title}`} />
      <div className="event-image-wrap">
        <img src={event.image} alt="" className="event-image" />
        <span className="card-category">{event.category}</span>
        {event.soon && <span className="soon-tag">Happening today</span>}
        <button className={isSaved ? "save-button is-saved" : "save-button"} type="button" onClick={(clickEvent) => { clickEvent.stopPropagation(); onSave() }} aria-label={isSaved ? `Remove ${event.title} from saved` : `Save ${event.title}`}>
          <Icon name={isSaved ? "check" : "bookmark"} />
        </button>
      </div>
      <div className="event-card-body">
        <div className="compact-date" style={{ background: event.color }}>
          <small>{event.weekday}</small>
          <strong>{event.day}</strong>
          <small>{event.month}</small>
        </div>
        <div className="event-card-copy">
          <p>{event.time} · {event.price}</p>
          <h3>{event.title}</h3>
          <span className="card-location"><Icon name="location" size={15} />{event.venue}{event.area ? `, ${event.area}` : ""}</span>
        </div>
      </div>
    </article>
  )
}

function FeaturedEvent({ event }: { event: VentyEvent }) {
  return (
    <article className="featured-event">
      <div className="carousel-label"><span />Featured event</div>
      <div className="carousel-stage">
        <section className="carousel-slide is-active">
          <div className="carousel-copy">
            <div className="carousel-meta"><span className="carousel-tag">{event.category}</span></div>
            <h2>{event.title}</h2>
            <p className="carousel-description">{event.description}</p>
            <div className="carousel-details">
              <div className="carousel-date"><strong>{event.day}</strong><span>{event.month}</span></div>
              <div><strong>{event.time}</strong><span><Icon name="location" size={16} />{event.venue}</span></div>
            </div>
            <a className="carousel-action" href={event.sourceUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`} target="_blank" rel="noreferrer">
              View event <Icon name="arrow" />
            </a>
          </div>
          <div className="carousel-poster" role="img" aria-label={`${event.title} poster`}>
            <span className="poster-index">01</span>
            <span className="poster-top">{event.category.toUpperCase()}</span>
            <strong>{event.title}</strong>
            <span className="poster-bottom">{event.venue.toUpperCase()}</span>
          </div>
        </section>
      </div>
    </article>
  )
}

function App() {
  const [view, setView] = useState<AppView>("explore")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [dateFilter, setDateFilter] = useState<DateFilter>("Any day")
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState<VentyEvent | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [submittedEvents, setSubmittedEvents] = useState<SubmittedEvent[]>([])
  const [location, setLocation] = useState("Hyderabad, India")
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [liveEvents, setLiveEvents] = useState<VentyEvent[]>([])
  const [toast, setToast] = useState("")
  const [assistantMessages, setAssistantMessages] = useState([{ role: "assistant", text: "Hi, I’m Venty. Ask me about events, venues, or plans for your next day out." }])
  const [assistantInput, setAssistantInput] = useState("")
  const [assistantLoading, setAssistantLoading] = useState(false)
  const assistantBodyRef = useRef<HTMLDivElement>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  useEffect(() => {
    if (!assistantOpen) return
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setAssistantOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey) }
  }, [assistantOpen])
  useEffect(() => {
    assistantBodyRef.current?.scrollTo({ top: assistantBodyRef.current.scrollHeight, behavior: "smooth" })
  }, [assistantMessages, assistantLoading, assistantOpen])
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  const searchLocation = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : location

  useEffect(() => {
    const handleInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent) }
    window.addEventListener("beforeinstallprompt", handleInstall)
    return () => window.removeEventListener("beforeinstallprompt", handleInstall)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ location: searchLocation })
    if (query.trim()) params.set("query", query.trim())
    fetch(`/.netlify/functions/events?${params}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return
        setLiveEvents((data.events || []).map(normaliseEvent).filter(Boolean))
      })
      .catch(() => { if (!cancelled) setLiveEvents([]) })
    return () => { cancelled = true }
  }, [query, searchLocation])

  const allEvents = useMemo(() => [...fallbackEvents, ...liveEvents], [liveEvents])

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const normalizedQuery = query.trim().toLowerCase()
      const matchesSearch = !normalizedQuery || [event.title, event.venue, event.area, event.category].some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesCategory = category === "All" || event.category === category
      const matchesDate = dateFilter === "Any day" || event.dateGroup === dateFilter
      const matchesSaved = view === "explore" || savedIds.includes(event.id)
      return matchesSearch && matchesCategory && matchesDate && matchesSaved
    })
  }, [allEvents, category, dateFilter, query, savedIds, view])

  const featured = allEvents.find((event) => event.featured) || allEvents[0]

  function toggleSaved(id: string) {
    setSavedIds((current) => {
      const isSaved = current.includes(id)
      setToast(isSaved ? "Removed from saved events" : "Saved for later")
      return isSaved ? current.filter((savedId) => savedId !== id) : [...current, id]
    })
  }

  function resetFilters() { setQuery(""); setCategory("All"); setDateFilter("Any day") }

  async function submitEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const { data, error } = await supabase.from("event_submissions").insert({
      title: String(form.get("name") || ""),
      venue: String(form.get("venue") || ""),
      starts_at: new Date(String(form.get("dateTime"))).toISOString(),
      ticket_url: String(form.get("ticketLink") || ""),
      price: String(form.get("price") || ""),
      social_url: String(form.get("socialLink") || "") || null,
      maps_url: String(form.get("mapsLink") || ""),
      email: String(form.get("email") || ""),
      status: "approved",
      client_token: localStorage.getItem("venty_submission_token") || crypto.randomUUID(),
    }).select().single()
    if (error) { setToast(error.message); return }
    localStorage.setItem("venty_submission_token", data.client_token)
    setSubmittedEvents((current) => [{ id: data.id, name: data.title, venue: data.venue, dateTime: data.starts_at, ticketLink: data.ticket_url || "", price: data.price || "", socialLink: data.social_url || "", mapsLink: data.maps_url || "", email: data.email, status: data.status }, ...current])
    setIsCreateOpen(false)
    setToast("Event published")
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setToast("Location is not available on this device"); return }
    setToast("Requesting location access…")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude })
        setLocation("Near you")
        setToast("Finding events near you")
      },
      () => setToast("Allow location access to find nearby events"),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  async function sendAssistantMessage(event: React.FormEvent) {
    event.preventDefault()
    const message = assistantInput.trim()
    if (!message || assistantLoading) return
    setAssistantMessages((current) => [...current, { role: "user", text: message }])
    setAssistantInput("")
    setAssistantLoading(true)
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: searchLocation, message, history: assistantMessages.slice(1) }),
      })
      const data = await response.json()
      setAssistantMessages((current) => [...current, { role: "assistant", text: data.reply || "I could not find events right now." }])
    } catch {
      setAssistantMessages((current) => [...current, { role: "assistant", text: "I could not reach the event service. Try again." }])
    } finally {
      setAssistantLoading(false)
    }
  }

  async function installApp() {
    if (installPrompt) { await installPrompt.prompt(); const result = await installPrompt.userChoice; setToast(result.outcome === "accepted" ? "Venty is installing" : "Install dismissed"); setInstallPrompt(null); return }
    setToast("On iPhone, tap Share then “Add to Home Screen”")
  }

  async function shareEvent(event: VentyEvent) {
    const shareData = { title: event.title, text: `${event.title} at ${event.venue}`, url: event.sourceUrl || window.location.href }
    try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareData.url); setToast("Event link copied") } } catch {}
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => { setView("explore"); resetFilters() }} aria-label="Venty explore">ventful<span>.</span></button>
          <div className="desktop-search">
            <Icon name="search" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, venues or areas" aria-label="Search events" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={16} /></button>}
          </div>
          <nav className="desktop-nav" aria-label="Primary">
            <button type="button" className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}>Explore</button>
            <button type="button" className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}>Saved{savedIds.length > 0 && <span>{savedIds.length}</span>}</button>
          </nav>
          <div className="header-tools">
            <details className="location-picker">
              <summary className="location-button"><Icon name="location" /><span>{location}</span><Icon name="chevron" size={15} /></summary>
              <div className="location-dropdown">
                <div className="location-dropdown-heading"><strong>Choose a location</strong><span>Events update automatically</span></div>
                <div className="state-picker">
                  <div className="state-options india-states">
                    {["Hyderabad, India", "Bengaluru, India", "Mumbai, India", "Delhi, India", "Chennai, India", "Kolkata, India", "Pune, India"].map((city) => (
                      <button type="button" key={city} onClick={(event) => { setCoordinates(null); setLocation(city); event.currentTarget.closest("details")?.removeAttribute("open") }}>{city}</button>
                    ))}
                  </div>
                  <div className="state-options us-states">
                    {["New York, US", "California, US", "Texas, US", "Illinois, US", "Florida, US", "London, UK", "Manchester, UK"].map((city) => (
                      <button type="button" key={city} onClick={(event) => { setCoordinates(null); setLocation(city); event.currentTarget.closest("details")?.removeAttribute("open") }}>{city}</button>
                    ))}
                  </div>
                </div>
              </div>
            </details>
            <button className={assistantOpen ? "ai-assistant-button is-open" : "ai-assistant-button"} type="button" aria-expanded={assistantOpen} onClick={() => setAssistantOpen(true)}><Icon name="compass" size={18} /><span>AI</span></button>
          </div>
        </div>
      </header>
        {assistantOpen && createPortal(
          <div className="ai-layer">
              <button className="ai-sidebar-backdrop" type="button" aria-label="Close Venty Assistant" onClick={() => setAssistantOpen(false)} />
              <aside className="ai-sidebar" aria-label="Venty Assistant">
                <div className="ai-sidebar-header">
                  <div className="ai-mark"><Icon name="compass" size={20} /></div>
                  <div><strong>Venty Assistant</strong><span>AI event guide</span></div>
                  <button type="button" aria-label="Close Venty Assistant" onClick={() => setAssistantOpen(false)}><Icon name="close" size={19} /></button>
                </div>
                <div className="ai-sidebar-body" ref={assistantBodyRef}>
                  {assistantMessages.map((message, index) => (
                    <div className={message.role === "user" ? "assistant-message is-user" : "assistant-message"} key={index}><span>{message.role === "user" ? "You" : "Venty Assistant"}</span><p>{message.text}</p></div>
                  ))}
                  {assistantLoading && <div className="assistant-message assistant-typing"><span>Venty Assistant</span><p>Searching events</p></div>}
                </div>
                <form className="ai-composer" onSubmit={sendAssistantMessage}>
                  <label htmlFor="venty-assistant-message">Message Venty Assistant</label>
                  <textarea id="venty-assistant-message" value={assistantInput} onChange={(event) => setAssistantInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} placeholder="Ask about events near you…" rows={4} />
                  <div><small>AI responses powered by Groq</small><button type="submit" disabled={assistantLoading || !assistantInput.trim()}>Send <Icon name="arrow" size={17} /></button></div>
                </form>
              </aside>
          </div>,
          document.body,
        )}

      <main className="app-main">
        <section className="app-intro">
          <div><p className="eyebrow"><span />Live around {location}</p><h1>{view === "saved" ? "Your saved plans." : "What are you up for?"}</h1></div>
          <button className="install-button" type="button" onClick={installApp}>Get the app <Icon name="arrow" /></button>
        </section>

        <div className="mobile-search">
          <Icon name="search" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, venues or areas" aria-label="Search events" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={17} /></button>}
        </div>

        <section className="your-events-section" aria-labelledby="your-events-title">
          <div className="your-events-heading">
            <div><p className="eyebrow">Host something</p><h2 id="your-events-title">Your events</h2><p>Published events appear instantly in Discover.</p></div>
            <button className="add-event-button" type="button" onClick={() => setIsCreateOpen(true)}><Icon name="plus" />Add your event</button>
          </div>
          {submittedEvents.length > 0 ? (
            <div className="submitted-events">
              {submittedEvents.map((event) => (
                <article className="submitted-event" key={event.id}>
                  <div className="submitted-event-date"><Icon name="calendar" size={18} /><span>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(event.dateTime))}</span></div>
                  <h3>{event.name}</h3>
                  <p><Icon name="location" size={16} />{event.venue}</p>
                  {event.socialLink && <a className="submitted-social-link" href={event.socialLink} target="_blank" rel="noreferrer"><Icon name="share" size={15} />Social media page</a>}
                  <div className="approval-status"><span />Published</div>
                </article>
              ))}
              <button className="add-event-tile" type="button" onClick={() => setIsCreateOpen(true)}><span><Icon name="plus" size={26} /></span>Create another event</button>
            </div>
          ) : (
            <button className="your-events-empty" type="button" onClick={() => setIsCreateOpen(true)}><span><Icon name="plus" size={27} /></span><strong>Add your first event</strong><small>It only takes a minute to publish it.</small></button>
          )}
        </section>

        {view === "explore" && featured && <FeaturedEvent event={featured} />}

        <section className="discover-section">
          <div className="discover-heading">
            <div><p className="eyebrow">{view === "saved" ? "Your shortlist" : "Discover"}</p><h2>{view === "saved" ? "Plans worth keeping" : "Events near you"}</h2></div>
            <span className="event-total">{filteredEvents.length} events</span>
          </div>
          <div className="filter-stack">
            <div className="date-row" aria-label="Filter by date">{dateFilters.map((item) => <button type="button" key={item} className={dateFilter === item ? "active" : ""} onClick={() => setDateFilter(item)}>{item}</button>)}</div>
            <div className="category-row" aria-label="Filter by category">{categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
          </div>
          {filteredEvents.length > 0 ? (
            <div className="events-grid">{filteredEvents.map((event) => <EventCard event={event} key={event.id} isSaved={savedIds.includes(event.id)} onOpen={() => setSelectedEvent(event)} onSave={() => toggleSaved(event.id)} />)}</div>
          ) : (
            <div className="empty-state"><span><Icon name={view === "saved" ? "bookmark" : "search"} size={28} /></span><h3>{view === "saved" ? "No saved events yet" : "No events found"}</h3><p>Try another location, search, date or category.</p><button type="button" onClick={() => { if (view === "saved") setView("explore"); resetFilters() }}>{view === "saved" ? "Explore events" : "Clear filters"}</button></div>
          )}
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button type="button" className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}><Icon name="compass" /><span>Explore</span></button>
        <button type="button" className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}><span className="mobile-save-icon"><Icon name="bookmark" />{savedIds.length > 0 && <small>{savedIds.length}</small>}</span><span>Saved</span></button>
        <button type="button" onClick={useMyLocation}><Icon name="location" /><span>Near me</span></button>
      </nav>

      {selectedEvent && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedEvent(null) }}>
          <section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
            <div className="modal-image">
              <img src={selectedEvent.image} alt="" />
              <button className="modal-close" type="button" onClick={() => setSelectedEvent(null)} aria-label="Close event details" autoFocus><Icon name="close" /></button>
              <button className={savedIds.includes(selectedEvent.id) ? "save-button is-saved" : "save-button"} type="button" onClick={() => toggleSaved(selectedEvent.id)} aria-label="Save event"><Icon name={savedIds.includes(selectedEvent.id) ? "check" : "bookmark"} /></button>
            </div>
            <div className="modal-content">
              <p className="modal-category">{selectedEvent.category}</p>
              <h2 id="event-modal-title">{selectedEvent.title}</h2>
              <div className="modal-facts">
                <div><Icon name="calendar" /><span><strong>{selectedEvent.weekday}, {selectedEvent.day} {selectedEvent.month}</strong>{selectedEvent.time}{selectedEvent.endTime ? `–${selectedEvent.endTime}` : ""}</span></div>
                <div><Icon name="location" /><span><strong>{selectedEvent.venue}</strong>{selectedEvent.area}</span></div>
                <div><Icon name="ticket" /><span><strong>{selectedEvent.price}</strong>Check organizer for details</span></div>
              </div>
              <p className="modal-description">{selectedEvent.description}</p>
              <div className="modal-actions">
                <a className="primary-action" href={selectedEvent.sourceUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.venue)}`} target="_blank" rel="noreferrer">View event <Icon name="arrow" /></a>
                <button type="button" onClick={() => shareEvent(selectedEvent)}><Icon name="share" /><span>Share</span></button>
              </div>
            </div>
          </section>
        </div>
      )}

      {isCreateOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsCreateOpen(false) }}>
          <section className="create-event-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title">
            <div className="create-event-header">
              <div><p className="modal-category">Submit an event</p><h2 id="create-event-title">Tell us what’s happening.</h2><p>Add the details below. Your event will be published immediately.</p></div>
              <button className="create-modal-close" type="button" onClick={() => setIsCreateOpen(false)} aria-label="Close event form"><Icon name="close" /></button>
            </div>
            <form className="event-form" onSubmit={submitEvent}>
              <label className="form-field form-field-wide"><span>Event name</span><input name="name" type="text" placeholder="e.g. Sunday Sessions" required autoFocus /></label>
              <label className="form-field form-field-wide"><span>Location / venue</span><input name="venue" type="text" placeholder="Venue name and area" required /></label>
              <label className="form-field form-field-wide"><span>Google Maps link</span><input name="mapsLink" type="url" placeholder="https://maps.app.goo.gl/..." required /></label>
              <label className="form-field form-field-wide"><span>Date and time</span><input name="dateTime" type="datetime-local" required /></label>
              <label className="form-field form-field-wide"><span>Link to purchase tickets</span><input name="ticketLink" type="url" placeholder="https://" required /></label>
              <label className="form-field form-field-wide"><span>Ticket price</span><input name="price" type="text" placeholder="e.g. ₹500 or Free" required /></label>
              <label className="form-field form-field-wide"><span>Event or organiser social media page</span><input name="socialLink" type="url" placeholder="https://instagram.com/yourpage" /><small>Optional.</small></label>
              <label className="form-field form-field-wide"><span>Email address</span><input name="email" type="email" placeholder="you@example.com" required /></label>
              <div className="form-footer"><p><Icon name="check" size={17} />Your event will be published immediately.</p><button type="submit">Publish event <Icon name="arrow" /></button></div>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><Icon name="check" size={17} />{toast}</div>}
    </div>
  )
}

export default App
