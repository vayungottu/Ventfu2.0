import { useEffect, useMemo, useState } from "react"

type DateFilter = "Any day" | "Today" | "Tomorrow" | "This weekend"
type AppView = "explore" | "saved"

type SubmittedEvent = {
  id: number
  name: string
  venue: string
  dateTime: string
  ticketLink: string
  price: string
  email: string
}

type VentyEvent = {
  id: number
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
  dateGroup: Exclude<DateFilter, "Any day">
  price: string
  description: string
  featured?: boolean
  soon?: boolean
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const events: VentyEvent[] = [
  {
    id: 1,
    day: "24",
    weekday: "SAT",
    month: "MAY",
    title: "Night Shift: Live at the Foundry",
    venue: "The Foundry",
    area: "Shoreditch",
    time: "8:00 PM",
    endTime: "11:30 PM",
    category: "Music",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85",
    color: "#e8452c",
    dateGroup: "Today",
    price: "From £14",
    description:
      "A late-night lineup of new voices, sharp guitars and room-shaking sets inside one of East London's best independent venues.",
    featured: true,
    soon: true,
  },
  {
    id: 2,
    day: "25",
    weekday: "SUN",
    month: "MAY",
    title: "After Hours: Studio Sessions",
    venue: "The Yard",
    area: "Hackney",
    time: "7:30 PM",
    endTime: "10:30 PM",
    category: "Music",
    image:
      "https://images.unsplash.com/photo-1603910234616-3b5f4a6be2b4?auto=format&fit=crop&w=1200&q=85",
    color: "#1f2a5a",
    dateGroup: "Tomorrow",
    price: "£12",
    description:
      "An intimate live session pairing emerging artists with stripped-back production, followed by a relaxed courtyard DJ set.",
  },
  {
    id: 3,
    day: "27",
    weekday: "TUE",
    month: "MAY",
    title: "Open Studio: New Forms",
    venue: "Unit 14",
    area: "Peckham",
    time: "6:00 PM",
    endTime: "9:00 PM",
    category: "Art",
    image:
      "https://images.unsplash.com/photo-1559228461-4fa1e7eb677c?auto=format&fit=crop&w=1200&q=85",
    color: "#f1b82d",
    dateGroup: "This weekend",
    price: "Free",
    description:
      "Meet local makers, explore new installations and see works in progress across three floors of independent studios.",
  },
  {
    id: 4,
    day: "28",
    weekday: "WED",
    month: "MAY",
    title: "Punchline Social Club",
    venue: "The Green Room",
    area: "Camden",
    time: "8:30 PM",
    endTime: "10:30 PM",
    category: "Comedy",
    image:
      "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=85",
    color: "#28766a",
    dateGroup: "This weekend",
    price: "£9",
    description:
      "A fast, friendly night of stand-up with six rising comics, one seasoned host and no awkward front-row ambushes.",
  },
  {
    id: 5,
    day: "30",
    weekday: "FRI",
    month: "MAY",
    title: "Rhythm Section: Rooftop",
    venue: "Atlas House",
    area: "Dalston",
    time: "5:00 PM",
    endTime: "11:00 PM",
    category: "Dance",
    image:
      "https://images.unsplash.com/photo-1619229725920-ac8b63b0631a?auto=format&fit=crop&w=1200&q=85",
    color: "#b25488",
    dateGroup: "This weekend",
    price: "From £18",
    description:
      "Sunset selections, warm house and left-field dance music on a rooftop made for long evenings with friends.",
  },
  {
    id: 6,
    day: "31",
    weekday: "SAT",
    month: "MAY",
    title: "Loud / Quiet: All Day Festival",
    venue: "Electric Park",
    area: "Brixton",
    time: "2:00 PM",
    endTime: "11:00 PM",
    category: "Festivals",
    image:
      "https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?auto=format&fit=crop&w=1200&q=85",
    color: "#e8452c",
    dateGroup: "This weekend",
    price: "£28",
    description:
      "A full day of live music, independent food, print stalls and after-dark performances across two outdoor stages.",
  },
  {
    id: 7,
    day: "01",
    weekday: "SUN",
    month: "JUN",
    title: "The Long Table: Summer Supper",
    venue: "Glasshouse Garden",
    area: "Bethnal Green",
    time: "6:30 PM",
    endTime: "9:30 PM",
    category: "Food",
    image:
      "https://images.unsplash.com/photo-1567942712661-82b9b407abbf?auto=format&fit=crop&w=1200&q=85",
    color: "#d3633a",
    dateGroup: "This weekend",
    price: "£35",
    description:
      "A generous seasonal menu served family-style in a candlelit greenhouse, with natural wine and live acoustic music.",
  },
  {
    id: 8,
    day: "02",
    weekday: "MON",
    month: "JUN",
    title: "Cinema Under the Arches",
    venue: "Rye Lane Arches",
    area: "Peckham",
    time: "7:00 PM",
    endTime: "10:00 PM",
    category: "Film",
    image:
      "https://images.unsplash.com/photo-1450044804117-534ccd6e6a3a?auto=format&fit=crop&w=1200&q=85",
    color: "#2d6073",
    dateGroup: "This weekend",
    price: "£11",
    description:
      "Cult cinema on a huge screen beneath the railway arches, complete with beanbags, local drinks and a short-film opener.",
  },
]

const categories = [
  "All",
  "Music",
  "Art",
  "Comedy",
  "Dance",
  "Festivals",
  "Food",
  "Film",
]
const dateFilters: DateFilter[] = [
  "Any day",
  "Today",
  "Tomorrow",
  "This weekend",
]

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "bookmark" | "calendar" | "check" | "chevron" | "close" | "compass" | "location" | "plus" | "search" | "share" | "ticket"
  size?: number
}) {
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    bookmark: (
      <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    share: (
      <>
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
      </>
    ),
    ticket: (
      <path d="M3 8.5V5h18v3.5a3.5 3.5 0 0 0 0 7V19H3v-3.5a3.5 3.5 0 0 0 0-7ZM13 8v8" />
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      {paths[name]}
    </svg>
  )
}

function EventCard({
  event,
  isSaved,
  onOpen,
  onSave,
}: {
  event: VentyEvent
  isSaved: boolean
  onOpen: () => void
  onSave: () => void
}) {
  return (
    <article className="event-card">
      <button
        className="card-hit-area"
        type="button"
        onClick={onOpen}
        aria-label={`View ${event.title}`}
      />
      <div className="event-image-wrap">
        <img src={event.image} alt="" className="event-image" />
        <span className="card-category">{event.category}</span>
        {event.soon && <span className="soon-tag">Happening today</span>}
        <button
          className={isSaved ? "save-button is-saved" : "save-button"}
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation()
            onSave()
          }}
          aria-label={
            isSaved ? `Remove ${event.title} from saved` : `Save ${event.title}`
          }
        >
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
          <p>
            {event.time} · {event.price}
          </p>
          <h3>{event.title}</h3>
          <span className="card-location">
            <Icon name="location" size={15} />
            {event.venue}, {event.area}
          </span>
        </div>
      </div>
    </article>
  )
}

function FeaturedEvent(_props: {
  event: VentyEvent
  isSaved: boolean
  onOpen: () => void
  onSave: () => void
}) {
  const slides = [
    {
      name: "Carousel / Slide 1",
      title: "Venty Hack Weekend",
      category: "Hackathon",
      date: "14",
      month: "NOV",
      time: "9:00 AM",
      location: "Indiranagar, Bengaluru",
      description: "Build something ridiculous in 36 hours.",
      action: "Get tickets",
      posterTop: "36 HOURS",
      posterBottom: "HACK / BUILD / BREAK",
      theme: "hack",
      soon: true,
    },
    {
      name: "Carousel / Slide 2",
      title: "Midnight Ramen Pop-up",
      category: "Food",
      date: "16",
      month: "NOV",
      time: "11:30 PM",
      location: "Koramangala, Bengaluru",
      description: "Late-night bowls, limited seats.",
      action: "Get tickets",
      posterTop: "NOODLES",
      posterBottom: "UNTIL SOLD OUT",
      theme: "ramen",
    },
    {
      name: "Carousel / Slide 3",
      title: "Model UN: Bengaluru Summit",
      category: "MUN",
      date: "18",
      month: "NOV",
      time: "8:30 AM",
      location: "Cubbon Park area, Bengaluru",
      description: "Two days of debate, diplomacy and questionable formalwear.",
      action: "View event",
      posterTop: "SPEAK / OBJECT",
      posterBottom: "DIPLOMACY, MOSTLY",
      theme: "mun",
    },
    {
      name: "Carousel / Slide 4",
      title: "Basement Indie Night",
      category: "Live music",
      date: "21",
      month: "NOV",
      time: "8:00 PM",
      location: "Church Street, Bengaluru",
      description: "Three local bands, one very small room.",
      action: "Get tickets",
      posterTop: "LOUD ENOUGH?",
      posterBottom: "3 BANDS / 1 ROOM",
      theme: "indie",
    },
  ]
  const [activeSlide, setActiveSlide] = useState(0)
  const [ticketMessage, setTicketMessage] = useState("")

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
      setTicketMessage("")
    }, 5000)

    return () => window.clearTimeout(timeout)
  }, [activeSlide, slides.length])

  const moveSlide = (direction: number) => {
    setActiveSlide(
      (current) => (current + direction + slides.length) % slides.length,
    )
    setTicketMessage("")
  }

  return (
    <article className="featured-event" aria-roledescription="carousel">
      <div className="carousel-label">
        <span />
        Featured this week
      </div>
      <div className="carousel-stage" aria-live="polite">
        {slides.map((slide, index) => (
          <section
            className={`carousel-slide poster-${slide.theme}${
              activeSlide === index ? " is-active" : ""
            }`}
            key={slide.name}
            aria-label={slide.name}
            data-layer-name={slide.name}
            aria-hidden={activeSlide !== index}
          >
            <div className="carousel-copy">
              <div className="carousel-meta">
                <span
                  data-layer-name="Category Tag"
                  className={
                    slide.category === "MUN"
                      ? "carousel-tag tag-blue"
                      : "carousel-tag"
                  }
                >
                  {slide.category}
                </span>
                {slide.soon && (
                  <span className="happening-tag">Happening soon</span>
                )}
              </div>
              <h2 data-layer-name="Event Title">{slide.title}</h2>
              <p className="carousel-description" data-layer-name="Description">
                {slide.description}
              </p>
              <div className="carousel-details">
                <div className="carousel-date" data-layer-name="Date Block">
                  <strong>{slide.date}</strong>
                  <span>{slide.month}</span>
                </div>
                <div>
                  <strong>{slide.time}</strong>
                  <span data-layer-name="Venue">
                    <Icon name="location" size={16} />
                    {slide.location}
                  </span>
                </div>
              </div>
              <button
                className="carousel-action"
                type="button"
                data-layer-name="CTA Button"
                disabled={activeSlide !== index}
                onClick={() =>
                  setTicketMessage(`${slide.title} tickets are opening soon.`)
                }
              >
                {slide.action} <Icon name="arrow" />
              </button>
              {ticketMessage && (
                <p className="ticket-message">{ticketMessage}</p>
              )}
            </div>

            <div
              className="carousel-poster"
              role="img"
              data-layer-name="Hero Image"
              aria-label={`${slide.title} event poster`}
            >
              <span className="poster-index">0{index + 1}</span>
              <span className="poster-top">{slide.posterTop}</span>
              <strong>{slide.title}</strong>
              <span className="poster-bottom">{slide.posterBottom}</span>
              <i aria-hidden="true" />
              <b aria-hidden="true">*</b>
            </div>
          </section>
        ))}
      </div>

      <div className="carousel-controls">
        <button
          type="button"
          onClick={() => moveSlide(-1)}
          aria-label="Previous featured event"
        >
          <Icon name="arrow" />
        </button>
        <div className="carousel-dots" aria-label="Choose featured event">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.name}
              className={activeSlide === index ? "active" : ""}
              onClick={() => {
                setActiveSlide(index)
                setTicketMessage("")
              }}
              aria-label={`Show ${slide.name}`}
              aria-current={activeSlide === index ? "true" : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => moveSlide(1)}
          aria-label="Next featured event"
        >
          <Icon name="arrow" />
        </button>
      </div>
    </article>
  )
}

function App() {
  const [view, setView] = useState<AppView>("explore")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [dateFilter, setDateFilter] = useState<DateFilter>("Any day")
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [selectedEvent, setSelectedEvent] = useState<VentyEvent | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [submittedEvents, setSubmittedEvents] = useState<SubmittedEvent[]>([])
  const [location, setLocation] = useState("London")
  const [toast, setToast] = useState("")
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handleInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handleInstall)
    return () =>
      window.removeEventListener("beforeinstallprompt", handleInstall)
  }, [])

  useEffect(() => {
    if (!selectedEvent && !isCreateOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEvent(null)
        setIsCreateOpen(false)
      }
    }
    document.body.classList.add("modal-open")
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.classList.remove("modal-open")
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isCreateOpen, selectedEvent])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch =
        !normalizedQuery ||
        [event.title, event.venue, event.area, event.category].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        )
      const matchesCategory = category === "All" || event.category === category
      const matchesDate =
        dateFilter === "Any day" || event.dateGroup === dateFilter
      const matchesSaved = view === "explore" || savedIds.includes(event.id)
      return matchesSearch && matchesCategory && matchesDate && matchesSaved
    })
  }, [category, dateFilter, query, savedIds, view])

  const featured = events.find((event) => event.featured)!

  function toggleSaved(id: number) {
    setSavedIds((current) => {
      const isSaved = current.includes(id)
      setToast(isSaved ? "Removed from saved events" : "Saved for later")
      return isSaved
        ? current.filter((savedId) => savedId !== id)
        : [...current, id]
    })
  }

  function resetFilters() {
    setQuery("")
    setCategory("All")
    setDateFilter("Any day")
  }

  function submitEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmittedEvents((current) => [
      {
        id: Date.now(),
        name: String(form.get("name")),
        venue: String(form.get("venue")),
        dateTime: String(form.get("dateTime")),
        ticketLink: String(form.get("ticketLink")),
        price: String(form.get("price")),
        email: String(form.get("email")),
      },
      ...current,
    ])
    setIsCreateOpen(false)
    setToast("Event sent to our team for approval")
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setToast("Location is not available on this device")
      return
    }
    setToast("Finding your location…")
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocation("Near you")
        setToast("Showing events near you")
      },
      () => setToast("Location access was not allowed"),
      { enableHighAccuracy: false, timeout: 7000 },
    )
  }

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt()
      const result = await installPrompt.userChoice
      setToast(
        result.outcome === "accepted"
          ? "Venty is installing"
          : "Install dismissed",
      )
      setInstallPrompt(null)
      return
    }
    setToast("On iPhone, tap Share then “Add to Home Screen”")
  }

  async function shareEvent(event: VentyEvent) {
    const shareData = {
      title: event.title,
      text: `${event.title} at ${event.venue} — ${event.day} ${event.month}, ${event.time}`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`,
        )
        setToast("Event link copied")
      }
    } catch {
      // The native share sheet was closed without sharing.
    }
  }

  function addToCalendar(event: VentyEvent) {
    const monthNumber: Record<string, string> = { MAY: "05", JUN: "06" }
    const to24HourTime = (value: string) => {
      const [time, period] = value.split(" ")
      const [rawHour, minute] = time.split(":").map(Number)
      const hour = (rawHour % 12) + (period === "PM" ? 12 : 0)
      return `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`
    }
    const calendarDate = `2026${monthNumber[event.month]}${event.day}`
    const details = `${event.description}\\n${event.venue}, ${event.area}`
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${event.venue}, ${event.area}, London`,
      `DTSTART:${calendarDate}T${to24HourTime(event.time)}`,
      `DTEND:${calendarDate}T${to24HourTime(event.endTime)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`
    link.click()
    URL.revokeObjectURL(link.href)
    setToast("Calendar file created")
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <button
            className="brand"
            type="button"
            onClick={() => {
              setView("explore")
              resetFilters()
            }}
            aria-label="Venty explore"
          >
            ventful<span>.</span>
          </button>

          <div className="desktop-search">
            <Icon name="search" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events, venues or areas"
              aria-label="Search events"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          <nav className="desktop-nav" aria-label="Primary">
            <button
              type="button"
              className={view === "explore" ? "active" : ""}
              onClick={() => setView("explore")}
            >
              Explore
            </button>
            <button
              type="button"
              className={view === "saved" ? "active" : ""}
              onClick={() => setView("saved")}
            >
              Saved
              {savedIds.length > 0 && <span>{savedIds.length}</span>}
            </button>
          </nav>

          <details className="location-picker">
            <summary className="location-button">
              <Icon name="location" />
              <span>{location}</span>
              <Icon name="chevron" size={15} />
            </summary>
            <div className="location-dropdown">
              <div className="location-dropdown-heading">
                <strong>Choose a location</strong>
                <span>Country first, then state</span>
              </div>

              <fieldset className="country-options">
                <legend>Country</legend>
                <input
                  type="radio"
                  name="location-country"
                  id="country-india"
                />
                <label htmlFor="country-india">India</label>
                <input type="radio" name="location-country" id="country-us" />
                <label htmlFor="country-us">United States</label>
                <input type="radio" name="location-country" id="country-uk" />
                <label htmlFor="country-uk">United Kingdom</label>
              </fieldset>

              <div className="state-picker">
                <p>State or region</p>
                <span className="state-prompt">
                  Select a country to see its states
                </span>
                <div className="state-options india-states">
                  {[
                    "Karnataka",
                    "Maharashtra",
                    "Delhi",
                    "Tamil Nadu",
                    "West Bengal",
                  ].map((state) => (
                    <button
                      type="button"
                      key={state}
                      onClick={(event) => {
                        setLocation(`${state}, India`)
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open")
                      }}
                    >
                      {state}
                    </button>
                  ))}
                </div>
                <div className="state-options us-states">
                  {[
                    "California",
                    "New York",
                    "Texas",
                    "Illinois",
                    "Florida",
                  ].map((state) => (
                    <button
                      type="button"
                      key={state}
                      onClick={(event) => {
                        setLocation(`${state}, US`)
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open")
                      }}
                    >
                      {state}
                    </button>
                  ))}
                </div>
                <div className="state-options uk-states">
                  {["England", "Scotland", "Wales", "Northern Ireland"].map(
                    (state) => (
                      <button
                        type="button"
                        key={state}
                        onClick={(event) => {
                          setLocation(`${state}, UK`)
                          event.currentTarget
                            .closest("details")
                            ?.removeAttribute("open")
                        }}
                      >
                        {state}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main className="app-main">
        <section className="app-intro">
          <div>
            <p className="eyebrow">
              <span />
              Live around {location}
            </p>
            <h1>
              {view === "saved" ? "Your saved plans." : "What are you up for?"}
            </h1>
          </div>
          <button className="install-button" type="button" onClick={installApp}>
            Get the app <Icon name="arrow" />
          </button>
        </section>

        <div className="mobile-search">
          <Icon name="search" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, venues or areas"
            aria-label="Search events"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <Icon name="close" size={17} />
            </button>
          )}
        </div>

        <section
          className="your-events-section"
          aria-labelledby="your-events-title"
        >
          <div className="your-events-heading">
            <div>
              <p className="eyebrow">Host something</p>
              <h2 id="your-events-title">Your events</h2>
              <p>
                Share what you’re putting on. Our team reviews every event
                before it goes live.
              </p>
            </div>
            <button
              className="add-event-button"
              type="button"
              onClick={() => setIsCreateOpen(true)}
            >
              <Icon name="plus" />
              Add your event
            </button>
          </div>

          {submittedEvents.length > 0 ? (
            <div className="submitted-events">
              {submittedEvents.map((event) => (
                <article className="submitted-event" key={event.id}>
                  <div className="submitted-event-date">
                    <Icon name="calendar" size={18} />
                    <span>
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(event.dateTime))}
                    </span>
                  </div>
                  <h3>{event.name}</h3>
                  <p>
                    <Icon name="location" size={16} />
                    {event.venue}
                  </p>
                  <div className="approval-status">
                    <span />
                    Pending approval
                  </div>
                </article>
              ))}
              <button
                className="add-event-tile"
                type="button"
                onClick={() => setIsCreateOpen(true)}
              >
                <span>
                  <Icon name="plus" size={26} />
                </span>
                Create another event
              </button>
            </div>
          ) : (
            <button
              className="your-events-empty"
              type="button"
              onClick={() => setIsCreateOpen(true)}
            >
              <span>
                <Icon name="plus" size={27} />
              </span>
              <strong>Add your first event</strong>
              <small>It only takes a minute to send it for review.</small>
            </button>
          )}
        </section>

        {view === "explore" && (
          <FeaturedEvent
            event={featured}
            isSaved={savedIds.includes(featured.id)}
            onSave={() => toggleSaved(featured.id)}
            onOpen={() => setSelectedEvent(featured)}
          />
        )}

        <section className="discover-section">
          <div className="discover-heading">
            <div>
              <p className="eyebrow">
                {view === "saved" ? "Your shortlist" : "Discover"}
              </p>
              <h2>
                {view === "saved" ? "Plans worth keeping" : "Events near you"}
              </h2>
            </div>
            <span className="event-total">{filteredEvents.length} events</span>
          </div>

          <div className="filter-stack">
            <div className="date-row" aria-label="Filter by date">
              {dateFilters.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={dateFilter === item ? "active" : ""}
                  onClick={() => setDateFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="category-row" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  event={event}
                  key={event.id}
                  isSaved={savedIds.includes(event.id)}
                  onOpen={() => setSelectedEvent(event)}
                  onSave={() => toggleSaved(event.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>
                <Icon
                  name={view === "saved" ? "bookmark" : "search"}
                  size={28}
                />
              </span>
              <h3>
                {view === "saved" ? "No saved events yet" : "No events found"}
              </h3>
              <p>
                {view === "saved"
                  ? "Tap the bookmark on anything you like and it will show up here."
                  : "Try another search, date or category."}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (view === "saved") setView("explore")
                  resetFilters()
                }}
              >
                {view === "saved" ? "Explore events" : "Clear filters"}
              </button>
            </div>
          )}
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          type="button"
          className={view === "explore" ? "active" : ""}
          onClick={() => setView("explore")}
        >
          <Icon name="compass" />
          <span>Explore</span>
        </button>
        <button
          type="button"
          className={view === "saved" ? "active" : ""}
          onClick={() => setView("saved")}
        >
          <span className="mobile-save-icon">
            <Icon name="bookmark" />
            {savedIds.length > 0 && <small>{savedIds.length}</small>}
          </span>
          <span>Saved</span>
        </button>
        <button type="button" onClick={useMyLocation}>
          <Icon name="location" />
          <span>Near me</span>
        </button>
      </nav>

      {selectedEvent && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedEvent(null)
          }}
        >
          <section
            className="event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
          >
            <div className="modal-image">
              <img src={selectedEvent.image} alt="" />
              <button
                className="modal-close"
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
                autoFocus
              >
                <Icon name="close" />
              </button>
              <button
                className={
                  savedIds.includes(selectedEvent.id)
                    ? "save-button is-saved"
                    : "save-button"
                }
                type="button"
                onClick={() => toggleSaved(selectedEvent.id)}
                aria-label="Save event"
              >
                <Icon
                  name={
                    savedIds.includes(selectedEvent.id) ? "check" : "bookmark"
                  }
                />
              </button>
            </div>
            <div className="modal-content">
              <p className="modal-category">{selectedEvent.category}</p>
              <h2 id="event-modal-title">{selectedEvent.title}</h2>
              <div className="modal-facts">
                <div>
                  <Icon name="calendar" />
                  <span>
                    <strong>
                      {selectedEvent.weekday}, {selectedEvent.day}{" "}
                      {selectedEvent.month}
                    </strong>
                    {selectedEvent.time}–{selectedEvent.endTime}
                  </span>
                </div>
                <div>
                  <Icon name="location" />
                  <span>
                    <strong>{selectedEvent.venue}</strong>
                    {selectedEvent.area}, London
                  </span>
                </div>
                <div>
                  <Icon name="ticket" />
                  <span>
                    <strong>{selectedEvent.price}</strong>
                    Instant confirmation
                  </span>
                </div>
              </div>
              <p className="modal-description">{selectedEvent.description}</p>
              <div className="modal-actions">
                <a
                  className="primary-action"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedEvent.venue}, ${selectedEvent.area}, London`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions <Icon name="arrow" />
                </a>
                <button
                  type="button"
                  onClick={() => addToCalendar(selectedEvent)}
                >
                  <Icon name="calendar" />
                  <span>Add to calendar</span>
                </button>
                <button type="button" onClick={() => shareEvent(selectedEvent)}>
                  <Icon name="share" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {isCreateOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsCreateOpen(false)
          }}
        >
          <section
            className="create-event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
          >
            <div className="create-event-header">
              <div>
                <p className="modal-category">Submit an event</p>
                <h2 id="create-event-title">Tell us what’s happening.</h2>
                <p>
                  Complete the details below. A member of our team will review
                  your request before it appears on Ventful.
                </p>
              </div>
              <button
                className="create-modal-close"
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close event form"
              >
                <Icon name="close" />
              </button>
            </div>

            <form className="event-form" onSubmit={submitEvent}>
              <label className="form-field form-field-wide">
                <span>Event name</span>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Sunday Sessions"
                  required
                  autoFocus
                />
              </label>
              <label className="form-field form-field-wide">
                <span>Location / venue</span>
                <input
                  name="venue"
                  type="text"
                  placeholder="Venue name and area"
                  required
                />
              </label>
              <label className="form-field form-field-wide">
                <span>Date and time</span>
                <input name="dateTime" type="datetime-local" required />
              </label>
              <label className="form-field form-field-wide">
                <span>Link to purchase tickets</span>
                <input
                  name="ticketLink"
                  type="url"
                  placeholder="https://"
                  required
                />
              </label>
              <label className="form-field form-field-wide">
                <span>Ticket price</span>
                <input
                  name="price"
                  type="text"
                  placeholder="e.g. £15 or Free"
                  required
                />
              </label>
              <label className="form-field form-field-wide">
                <span>Email address</span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
                <small>
                  We’ll use this to contact you about approval or any questions.
                </small>
              </label>
              <div className="form-footer">
                <p>
                  <Icon name="check" size={17} />
                  Your event won’t be published until it’s approved.
                </p>
                <button type="submit">
                  Send for approval <Icon name="arrow" />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
