import { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabaseClient"
import { useUserLocation } from "./useUserLocation"
import "./create-event.css"

type DateFilter = "Any day" | "Today" | "Tomorrow" | "This weekend"
type AppView = "explore" | "saved"

type ApiSource = { title?: string; url?: string }

type ApiEvent = {
  title?: string
  category?: string
  date?: string
  time?: string
  endTime?: string
  venue?: string
  area?: string
  price?: string
  description?: string
  summary?: string
  sourceUrl?: string
  sources?: ApiSource[]
  imageQuery?: string
}

type DbEvent = {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  area: string
  address: string
  starts_at: string
  image_url: string
  instagram_url: string
  maps_url: string
  external_url: string
  source: string
  created_at: string
}

type AppEvent = {
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
  summary: string
  sourceUrl: string
  sources: ApiSource[]
  mapsUrl: string
  soon: boolean
  isUserPost: boolean
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const categories = ["All", "Music", "Art", "Comedy", "Dance", "Festivals", "Food", "Film", "MUN", "Birthday", "Sports", "Other"]
const dateFilters: DateFilter[] = ["Any day", "Today", "Tomorrow", "This weekend"]
const eventColors = ["#e8452c", "#1f2a5a", "#f1b82d", "#28766a", "#b25488", "#d3633a", "#2d6073"]

function placeholderImage(title: string) {
  const text = encodeURIComponent(title.slice(0, 28) || "Event")
  return `https://placehold.co/900x600/171512/f4efe6/png?text=${text}`
}

function formatDate(value?: string) {
  if (!value) return null
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function dateGroupFor(date: Date | null): DateFilter {
  if (!date) return "Any day"
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const difference = Math.round((eventDay.getTime() - today.getTime()) / 86400000)
  if (difference === 0) return "Today"
  if (difference === 1) return "Tomorrow"
  const weekday = eventDay.getDay()
  const daysUntilWeekend = (6 - now.getDay() + 7) % 7
  if ((weekday === 0 || weekday === 6) && difference >= 0 && difference <= daysUntilWeekend + 1) return "This weekend"
  return "Any day"
}

function normaliseEvent(raw: ApiEvent, index: number): AppEvent | null {
  if (!raw.title) return null
  const date = formatDate(raw.date)
  const id = `${raw.title}-${raw.date ?? ""}-${raw.venue ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const venue = raw.venue || "Venue to be announced"
  const area = raw.area || ""
  return {
    id,
    day: date ? String(date.getDate()).padStart(2, "0") : "--",
    weekday: date ? date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase() : "",
    month: date ? date.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "",
    title: raw.title,
    venue,
    area,
    time: raw.time || "Time TBA",
    endTime: raw.endTime || "",
    category: raw.category || "Event",
    image: placeholderImage(raw.title),
    color: eventColors[index % eventColors.length],
    dateGroup: dateGroupFor(date),
    price: raw.price || "Price TBA",
    description: raw.description || raw.summary || "Details will be announced by the organizer.",
    summary: raw.summary || "",
    sourceUrl: raw.sourceUrl || "",
    sources: Array.isArray(raw.sources) ? raw.sources.filter((source) => source?.url) : [],
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue}, ${area}`)}`,
    soon: dateGroupFor(date) === "Today",
    isUserPost: false,
  }
}

function userEventToAppEvent(row: DbEvent, index: number): AppEvent {
  const date = new Date(row.starts_at)
  const validDate = !Number.isNaN(date.getTime()) ? date : null
  const venue = row.address || "Venue to be announced"
  return {
    id: row.id,
    day: validDate ? String(validDate.getDate()).padStart(2, "0") : "--",
    weekday: validDate ? validDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase() : "",
    month: validDate ? validDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "",
    title: row.title,
    venue,
    area: row.area,
    time: validDate ? validDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Time TBA",
    endTime: "",
    category: row.category || "Event",
    image: row.image_url || placeholderImage(row.title),
    color: eventColors[index % eventColors.length],
    dateGroup: dateGroupFor(validDate),
    price: "Free / see details",
    description: row.description || "No description provided.",
    summary: "",
    sourceUrl: row.external_url || row.instagram_url || "",
    sources: [],
    mapsUrl: row.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue}, ${row.area}`)}`,
    soon: dateGroupFor(validDate) === "Today",
    isUserPost: true,
  }
}

function Icon({ name, size = 20 }: { name: "arrow" | "bookmark" | "calendar" | "check" | "chevron" | "close" | "compass" | "link" | "location" | "plus" | "search" | "share" | "ticket"; size?: number }) {
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></>,
    ticket: <path d="M3 8.5V5h18v3.5a3.5 3.5 0 0 0 0 7V19H3v-3.5a3.5 3.5 0 0 0 0-7ZM13 8v8" />,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>{paths[name]}</svg>
}

function EventCard({ event, isSaved, onOpen, onSave }: { event: AppEvent; isSaved: boolean; onOpen: () => void; onSave: () => void }) {
  return (
    <article className="event-card">
      <button className="card-hit-area" type="button" onClick={onOpen} aria-label={`View ${event.title}`} />
      <div className="event-image-wrap">
        <img src={event.image} alt="" className="event-image" />
        <span className="card-category">{event.category}</span>
        {event.isUserPost && <span className="soon-tag">Community post</span>}
        {!event.isUserPost && event.soon && <span className="soon-tag">Happening today</span>}
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

function FeaturedEvent({ events }: { events: AppEvent[] }) {
  const slides = events.slice(0, 4)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const timeout = window.setTimeout(() => setActiveSlide((current) => (current + 1) % slides.length), 6000)
    return () => window.clearTimeout(timeout)
  }, [activeSlide, slides.length])

  if (!slides.length) return null
  const moveSlide = (direction: number) => setActiveSlide((current) => (current + direction + slides.length) % slides.length)

  return (
    <article className="featured-event" aria-roledescription="carousel">
      <div className="carousel-label"><span />Featured this week</div>
      <div className="carousel-stage" aria-live="polite">
        {slides.map((event, index) => (
          <section className={`carousel-slide${activeSlide === index ? " is-active" : ""}`} key={event.id} aria-label={event.title} aria-hidden={activeSlide !== index}>
            <div className="carousel-copy">
              <div className="carousel-meta">
                <span className="carousel-tag">{event.category}</span>
                {event.soon && <span className="happening-tag">Happening today</span>}
              </div>
              <h2>{event.title}</h2>
              <p className="carousel-description">{event.summary || event.description}</p>
              <div className="carousel-details">
                <div className="carousel-date"><strong>{event.day}</strong><span>{event.month}</span></div>
                <div><strong>{event.time}</strong><span><Icon name="location" size={16} />{event.venue}{event.area ? `, ${event.area}` : ""}</span></div>
              </div>
              <button className="carousel-action" type="button" disabled={activeSlide !== index} onClick={() => window.open(event.sourceUrl || event.mapsUrl, "_blank", "noopener")}>
                View event <Icon name="arrow" />
              </button>
            </div>
            <div className="carousel-poster" role="img" aria-label={`${event.title} poster`}>
              <span className="poster-index">0{index + 1}</span>
              <span className="poster-top">{event.category.toUpperCase()}</span>
              <strong>{event.title}</strong>
              <span className="poster-bottom">{event.venue.toUpperCase()}</span>
              <i aria-hidden="true" /><b aria-hidden="true">*</b>
            </div>
          </section>
        ))}
      </div>
      <div className="carousel-controls">
        <button type="button" onClick={() => moveSlide(-1)} aria-label="Previous featured event"><Icon name="arrow" /></button>
        <div className="carousel-dots" aria-label="Choose featured event">
          {slides.map((event, index) => <button type="button" key={event.id} className={activeSlide === index ? "active" : ""} onClick={() => setActiveSlide(index)} aria-label={`Show ${event.title}`} aria-current={activeSlide === index ? "true" : undefined} />)}
        </div>
        <button type="button" onClick={() => moveSlide(1)} aria-label="Next featured event"><Icon name="arrow" /></button>
      </div>
    </article>
  )
}

function CreateEventModal({ onClose, onCreated, onToast }: { onClose: () => void; onCreated: () => void; onToast: (message: string) => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Other")
  const [address, setAddress] = useState("")
  const [area, setArea] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [website, setWebsite] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) throw new Error("Please sign in to post an event")

      let imageUrl = ""
      if (photo) {
        const path = `${user.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`
        const { error: uploadError } = await supabase.storage.from("event-photos").upload(path, photo, { cacheControl: "3600", upsert: false })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from("event-photos").getPublicUrl(path)
        imageUrl = data.publicUrl
      }

      const { error: insertError } = await supabase.from("events").insert({
        user_id: user.id,
        title,
        description,
        category,
        address,
        area,
        starts_at: new Date(startsAt).toISOString(),
        image_url: imageUrl,
        external_url: website,
        maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${area}`)}`,
        source: "user",
        status: "approved",
      })
      if (insertError) throw insertError

      onToast("Event posted")
      onCreated()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not post event")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="event-modal create-event-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title">
        <div className="modal-content">
          <p className="modal-category">Post an event</p>
          <h2 id="create-event-title">Share something happening</h2>
          <form className="create-form" onSubmit={submit}>
            <label>Event title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Independence Day MUN" /></label>
            <label>Description<textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is happening, who should come, and what to expect?" rows={4} /></label>
            <div className="create-grid">
              <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{["Music", "Art", "Comedy", "Dance", "Festivals", "Food", "Film", "MUN", "Birthday", "Sports", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Date and time<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
            </div>
            <div className="create-grid">
              <label>Venue / address<input required value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Cubbon Park" /></label>
              <label>Area / city<input required value={area} onChange={(event) => setArea(event.target.value)} placeholder="Bengaluru" /></label>
            </div>
            <label>Event website or sign-up link<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://example.com" /></label>
            <label>One photo (optional)<input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></label>
            {error && <p className="modal-description create-error">{error}</p>}
            <div className="modal-actions create-actions">
              <button className="primary-action" type="submit" disabled={saving}>{saving ? "Posting…" : "Post event"} <Icon name="arrow" /></button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [view, setView] = useState<AppView>("explore")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [dateFilter, setDateFilter] = useState<DateFilter>("Any day")
  const [events, setEvents] = useState<AppEvent[]>([])
  const [userEvents, setUserEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)
  const [manualLocation, setManualLocation] = useState("Bengaluru, India")
  const [toast, setToast] = useState("")
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [session, setSession] = useState<any>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  const location = useUserLocation()
  const searchLocation = location.coordinates ? `${location.coordinates.latitude},${location.coordinates.longitude}` : manualLocation

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => authListener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent) }
    window.addEventListener("beforeinstallprompt", handleInstall)
    return () => window.removeEventListener("beforeinstallprompt", handleInstall)
  }, [])

  useEffect(() => {
    if (!selectedEvent && !createOpen) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setSelectedEvent(null); setCreateOpen(false) } }
    document.body.classList.add("modal-open")
    window.addEventListener("keydown", onKeyDown)
    return () => { document.body.classList.remove("modal-open"); window.removeEventListener("keydown", onKeyDown) }
  }, [selectedEvent, createOpen])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ location: searchLocation })
        if (query.trim()) params.set("query", query.trim())
        const response = await fetch(`/.netlify/functions/events?${params.toString()}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Could not load events")
        const mapped = (data.events || []).map(normaliseEvent).filter((event): event is AppEvent => Boolean(event))
        if (!cancelled) setEvents(mapped)
      } catch (caught) {
        if (!cancelled) { setEvents([]); setError(caught instanceof Error ? caught.message : "Could not load events") }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 500)
    return () => { cancelled = true; window.clearTimeout(timeout) }
  }, [query, searchLocation])

  async function loadUserEvents() {
    const { data } = await supabase.from("events").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(50)
    setUserEvents((data || []).map(userEventToAppEvent))
  }

  useEffect(() => { loadUserEvents() }, [])

  useEffect(() => {
    if (!session) { setSavedIds([]); return }
    supabase.from("saved_events").select("event_key").eq("user_id", session.user.id).then(({ data }) => setSavedIds((data || []).map((row: any) => row.event_key)))
  }, [session])

  const allEvents = useMemo(() => [...userEvents, ...events], [userEvents, events])

  const filteredEvents = useMemo(() => allEvents.filter((event) => {
    const matchesCategory = category === "All" || event.category === category
    const matchesDate = dateFilter === "Any day" || event.dateGroup === dateFilter
    const matchesSaved = view === "explore" || savedIds.includes(event.id)
    return matchesCategory && matchesDate && matchesSaved
  }), [allEvents, category, dateFilter, savedIds, view])

  async function toggleSaved(event: AppEvent) {
    if (!session) { setAuthMode("signin"); setAuthOpen(true); setToast("Sign in to save events"); return }
    const isSaved = savedIds.includes(event.id)
    if (isSaved) {
      await supabase.from("saved_events").delete().eq("user_id", session.user.id).eq("event_key", event.id)
      setSavedIds((current) => current.filter((id) => id !== event.id))
      setToast("Removed from saved events")
      return
    }
    await supabase.from("saved_events").insert({ user_id: session.user.id, event_key: event.id, title: event.title, category: event.category, date: event.dateGroup === "Any day" ? null : event.dateGroup, time: event.time, venue: event.venue, area: event.area, price: event.price, description: event.description, summary: event.summary, source_url: event.sourceUrl, image_query: event.title })
    setSavedIds((current) => [...current, event.id])
    setToast("Saved for later")
  }

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault()
    setAuthError("")
    const { error } = authMode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
    if (error) { setAuthError(error.message); return }
    setAuthOpen(false); setEmail(""); setPassword("")
    setToast(authMode === "signup" ? "Check your email to confirm your account" : "Signed in")
  }

  async function signOut() { await supabase.auth.signOut(); setToast("Signed out") }
  function resetFilters() { setQuery(""); setCategory("All"); setDateFilter("Any day") }

  async function installApp() {
    if (installPrompt) { await installPrompt.prompt(); const result = await installPrompt.userChoice; setToast(result.outcome === "accepted" ? "Ventful is installing" : "Install dismissed"); setInstallPrompt(null); return }
    setToast("On iPhone, tap Share then “Add to Home Screen”")
  }

  async function shareEvent(event: AppEvent) {
    const shareData = { title: event.title, text: `${event.title} at ${event.venue} — ${event.day} ${event.month}, ${event.time}`, url: event.sourceUrl || event.mapsUrl || window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else { await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); setToast("Event link copied") }
    } catch { /* Share sheet closed. */ }
  }

  function openCreate() {
    if (!session) { setAuthMode("signin"); setAuthOpen(true); setToast("Sign in to post an event"); return }
    setCreateOpen(true)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => { setView("explore"); resetFilters() }} aria-label="Ventful explore">ventful<span>.</span></button>
          <div className="desktop-search">
            <Icon name="search" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, venues or areas" aria-label="Search events" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={16} /></button>}
          </div>
          <nav className="desktop-nav" aria-label="Primary">
            <button type="button" className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}>Explore</button>
            <button type="button" className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}>Saved{savedIds.length > 0 && <span>{savedIds.length}</span>}</button>
          </nav>
          {session ? <button className="location-button" type="button" onClick={signOut}>Sign out</button> : <button className="location-button" type="button" onClick={() => { setAuthMode("signin"); setAuthOpen(true) }}>Sign in</button>}
          <details className="location-picker">
            <summary className="location-button"><Icon name="location" /><span>{location.status === "granted" ? "Near you" : manualLocation}</span><Icon name="chevron" size={15} /></summary>
            <div className="location-dropdown">
              <div className="location-dropdown-heading"><strong>Choose a location</strong><span>Used to find nearby events</span></div>
              <div className="state-picker">
                <div className="state-options india-states">
                  {["Bengaluru, India", "Mumbai, India", "Delhi, India", "Chennai, India", "Kolkata, India"].map((place) => <button type="button" key={place} onClick={(event) => { setManualLocation(place); event.currentTarget.closest("details")?.removeAttribute("open") }}>{place}</button>)}
                </div>
              </div>
            </div>
          </details>
        </div>
      </header>
      <main className="app-main">
        <section className="app-intro">
          <div><p className="eyebrow"><span />Live around {location.status === "granted" ? "you" : manualLocation}</p><h1>{view === "saved" ? "Your saved plans." : "What are you up for?"}</h1></div>
          <button className="install-button" type="button" onClick={installApp}>Get the app <Icon name="arrow" /></button>
        </section>
        <div className="mobile-search">
          <Icon name="search" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, venues or areas" aria-label="Search events" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={17} /></button>}
        </div>
        {view === "explore" && <FeaturedEvent events={allEvents} />}
        <section className="discover-section">
          <div className="discover-heading">
            <div><p className="eyebrow">{view === "saved" ? "Your shortlist" : "Discover"}</p><h2>{view === "saved" ? "Plans worth keeping" : "Events near you"}</h2></div>
            <span className="event-total">{loading ? "Loading…" : `${filteredEvents.length} events`}</span>
          </div>
          <div className="filter-stack">
            <div className="date-row" aria-label="Filter by date">{dateFilters.map((item) => <button type="button" key={item} className={dateFilter === item ? "active" : ""} onClick={() => setDateFilter(item)}>{item}</button>)}</div>
            <div className="category-row" aria-label="Filter by category">{categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
          </div>
          {error && <div className="empty-state"><span><Icon name="search" size={28} /></span><h3>Could not load events</h3><p>{error}</p></div>}
          {!error && loading && <div className="empty-state"><span><Icon name="compass" size={28} /></span><h3>Finding events near you…</h3><p>Ventful is searching for current local events.</p></div>}
          {!error && !loading && filteredEvents.length > 0 && <div className="events-grid">{filteredEvents.map((event) => <EventCard event={event} key={event.id} isSaved={savedIds.includes(event.id)} onOpen={() => setSelectedEvent(event)} onSave={() => toggleSaved(event)} />)}</div>}
          {!error && !loading && filteredEvents.length === 0 && <div className="empty-state"><span><Icon name={view === "saved" ? "bookmark" : "search"} size={28} /></span><h3>{view === "saved" ? "No saved events yet" : "No events found"}</h3><p>Try another search, date, category, or location.</p></div>}
        </section>
      </main>
      <button className="floating-post-button" type="button" onClick={openCreate} aria-label="Post an event"><Icon name="plus" size={26} /></button>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button type="button" className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}><Icon name="compass" /><span>Explore</span></button>
        <button type="button" onClick={openCreate}><span className="mobile-post-icon"><Icon name="plus" /></span><span>Post</span></button>
        <button type="button" className={view === "saved" ? "active" : ""} onClick={() => setView("saved")}><span className="mobile-save-icon"><Icon name="bookmark" />{savedIds.length > 0 && <small>{savedIds.length}</small>}</span><span>Saved</span></button>
        <button type="button" onClick={location.request}><Icon name="location" /><span>Near me</span></button>
      </nav>
      {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setAuthOpen(false)}><section className="event-modal" role="dialog" aria-modal="true"><div className="modal-content"><p className="modal-category">{authMode === "signup" ? "Create account" : "Welcome back"}</p><h2>{authMode === "signup" ? "Sign up for Ventful" : "Sign in to Ventful"}</h2><form onSubmit={handleAuth}><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" /><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />{authError && <p className="modal-description">{authError}</p>}<div className="modal-actions"><button className="primary-action" type="submit">{authMode === "signup" ? "Create account" : "Sign in"} <Icon name="arrow" /></button><button type="button" onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}>{authMode === "signup" ? "I have an account" : "Create an account"}</button></div></form></div></section></div>}
      {createOpen && <CreateEventModal onClose={() => setCreateOpen(false)} onCreated={loadUserEvents} onToast={setToast} />}
      {selectedEvent && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setSelectedEvent(null)}><section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title"><div className="modal-image"><img src={selectedEvent.image} alt="" /><button className="modal-close" type="button" onClick={() => setSelectedEvent(null)} aria-label="Close event details" autoFocus><Icon name="close" /></button><button className={savedIds.includes(selectedEvent.id) ? "save-button is-saved" : "save-button"} type="button" onClick={() => toggleSaved(selectedEvent)} aria-label="Save event"><Icon name={savedIds.includes(selectedEvent.id) ? "check" : "bookmark"} /></button></div><div className="modal-content"><p className="modal-category">{selectedEvent.category}</p><h2 id="event-modal-title">{selectedEvent.title}</h2><div className="modal-facts"><div><Icon name="calendar" /><span><strong>{selectedEvent.weekday}, {selectedEvent.day} {selectedEvent.month}</strong>{selectedEvent.time}{selectedEvent.endTime ? `–${selectedEvent.endTime}` : ""}</span></div><div><Icon name="location" /><span><strong>{selectedEvent.venue}</strong>{selectedEvent.area}</span></div><div><Icon name="ticket" /><span><strong>{selectedEvent.price}</strong>{selectedEvent.isUserPost ? "Community event" : "AI-discovered event"}</span></div></div>{selectedEvent.summary && <p className="modal-description">{selectedEvent.summary}</p>}<p className="modal-description">{selectedEvent.description}</p>{selectedEvent.sources.length > 0 && <div className="modal-actions">{selectedEvent.sources.slice(0, 3).map((source, index) => <a key={source.url} className="primary-action" href={source.url} target="_blank" rel="noreferrer"><Icon name="link" />{source.title || `Source ${index + 1}`}</a>)}</div>}<div className="modal-actions"><a className="primary-action" href={selectedEvent.mapsUrl} target="_blank" rel="noreferrer">Get directions <Icon name="arrow" /></a>{selectedEvent.sourceUrl && <a className="website-action" href={selectedEvent.sourceUrl} target="_blank" rel="noreferrer"><Icon name="link" /><span>Website</span></a>}<button type="button" onClick={() => shareEvent(selectedEvent)}><Icon name="share" /><span>Share</span></button></div></div></section></div>}
      {toast && <div className="toast" role="status"><Icon name="check" size={17} />{toast}</div>}
    </div>
  )
}

export default App
