import { FormEvent, useEffect, useRef, useState } from "react"

type ReelEvent = {
  id: number
  title: string
  category: string
  date: string
  time: string
  venue: string
  city: string
  price: string
  caption: string
  organizer: string
  initials: string
  image: string
  imagePosition?: string
  likes: number
  comments: number
}

const reels: ReelEvent[] = [
  {
    id: 1,
    title: "Neon After Dark",
    category: "Rooftop party",
    date: "Fri 20 Nov",
    time: "8 PM",
    venue: "Skyline Roof",
    city: "London",
    price: "£18",
    caption:
      "City lights, low ceilings and a DJ set that runs well past midnight.",
    organizer: "Night People",
    initials: "NP",
    image:
      "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=88",
    imagePosition: "55% center",
    likes: 2841,
    comments: 186,
  },
  {
    id: 2,
    title: "Canvas & Cocktails",
    category: "Art night",
    date: "Sat 21 Nov",
    time: "6 PM",
    venue: "Studio Nine",
    city: "London",
    price: "£12",
    caption:
      "Paint something bold, meet somebody new, leave with a canvas under your arm.",
    organizer: "Studio Nine",
    initials: "S9",
    image:
      "https://images.unsplash.com/photo-1526389157-6a5cc2bb4afa?auto=format&fit=crop&w=1200&q=88",
    imagePosition: "center center",
    likes: 1704,
    comments: 92,
  },
  {
    id: 3,
    title: "Midnight Bites",
    category: "Street food",
    date: "Sat 21 Nov",
    time: "7 PM",
    venue: "East Yard",
    city: "London",
    price: "Free",
    caption:
      "Open flames, secret menus and the best late-night plates in the east.",
    organizer: "East Yard Social",
    initials: "EY",
    image:
      "https://images.unsplash.com/photo-1552538962-40822613a09d?auto=format&fit=crop&w=1200&q=88",
    imagePosition: "center center",
    likes: 3926,
    comments: 247,
  },
  {
    id: 4,
    title: "Sunday Unplugged",
    category: "Acoustic gig",
    date: "Sun 22 Nov",
    time: "5 PM",
    venue: "The Green Room",
    city: "London",
    price: "£10",
    caption:
      "Three songwriters, warm lamps and a room quiet enough to hear every word.",
    organizer: "Green Room Live",
    initials: "GR",
    image:
      "https://images.unsplash.com/photo-1536594527669-2f555de54e95?auto=format&fit=crop&w=1200&q=88",
    imagePosition: "58% center",
    likes: 2158,
    comments: 134,
  },
]

const sampleComments = [
  {
    name: "Maya R.",
    text: "This is exactly what I needed this weekend.",
    initials: "MR",
  },
  { name: "Jon Bell", text: "Who else is going?", initials: "JB" },
  { name: "Imani K.", text: "Saved. See you there.", initials: "IK" },
]

type IconName = "bookmark" | "calendar" | "chevron" | "close" | "comment" | "heart" | "link" | "location" | "mute" | "pause" | "play" | "send" | "share" | "ticket" | "volume"

function Icon({
  name,
  filled = false,
  size = 24,
}: {
  name: IconName
  filled?: boolean
  size?: number
}) {
  const paths: Record<IconName, React.ReactNode> = {
    bookmark: (
      <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z" />
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    chevron: <path d="m7 14 5-5 5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    comment: (
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.7 9.7 0 0 1-3.7-.8L3 21l1.7-5A8.5 8.5 0 1 1 21 11.5Z" />
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    mute: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="m18 9-5 6M13 9l5 6" />
      </>
    ),
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7V5Z" />,
    send: <path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l4-4" />,
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
    volume: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={filled ? "icon-filled" : ""}
    >
      {paths[name]}
    </svg>
  )
}

function formatCount(count: number) {
  return count >= 1000
    ? `${(count / 1000).toFixed(1).replace(".0", "")}K`
    : String(count)
}

export default function App() {
  const reelScroller = useRef<HTMLDivElement>(null)
  const reelNodes = useRef<Array<HTMLElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [liked, setLiked] = useState<number[]>([])
  const [saved, setSaved] = useState<number[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [commentEvent, setCommentEvent] = useState<ReelEvent | null>(null)
  const [shareEvent, setShareEvent] = useState<ReelEvent | null>(null)
  const [comment, setComment] = useState("")
  const [postedComments, setPostedComments] =
    useState<Record<number, string[]>>({})
  const [toast, setToast] = useState("")

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 100 ? 0 : current + 0.4))
    }, 100)
    return () => window.clearInterval(timer)
  }, [activeIndex, playing])

  useEffect(() => {
    setProgress(0)
    setPlaying(true)
  }, [activeIndex])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!commentEvent && !shareEvent) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCommentEvent(null)
        setShareEvent(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [commentEvent, shareEvent])

  function onScroll() {
    const container = reelScroller.current
    if (!container) return
    const nextIndex = Math.round(container.scrollTop / container.clientHeight)
    if (
      nextIndex !== activeIndex &&
      nextIndex >= 0 &&
      nextIndex < reels.length
    ) {
      setActiveIndex(nextIndex)
    }
  }

  function goToReel(index: number) {
    const safeIndex = Math.max(0, Math.min(reels.length - 1, index))
    reelNodes.current[safeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  function toggleId(
    id: number,
    setter: React.Dispatch<React.SetStateAction<number[]>>,
  ) {
    setter((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  async function copyLink(event: ReelEvent) {
    const url = `${window.location.origin}${window.location.pathname}#event-${event.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      textarea.remove()
    }
    setToast("Link copied")
  }

  function postComment(event: FormEvent) {
    event.preventDefault()
    const value = comment.trim()
    if (!commentEvent || !value) return
    setPostedComments((current) => ({
      ...current,
      [commentEvent.id]: [...(current[commentEvent.id] ?? []), value],
    }))
    setComment("")
    setToast("Comment posted")
  }

  return (
    <div className="reels-app">
      <header className="reels-header">
        <div className="reels-header-inner">
          <div className="reels-brand">
            ventful<span>.</span>
          </div>
          <div className="demo-disclosure">Fictional demo events</div>
          <button type="button" className="reels-location">
            <Icon name="location" size={17} />
            London
          </button>
        </div>
      </header>

      <main className="reels-main">
        <div className="viewer-shell">
          <div className="reel-scroller" ref={reelScroller} onScroll={onScroll}>
            {reels.map((event, index) => {
              const isActive = index === activeIndex
              const isLiked = liked.includes(event.id)
              const isSaved = saved.includes(event.id)
              const isFollowing = following.includes(event.organizer)
              const extraComments = postedComments[event.id]?.length ?? 0

              return (
                <section
                  className="event-reel"
                  id={`event-${event.id}`}
                  key={event.id}
                  ref={(node) => {
                    reelNodes.current[index] = node
                  }}
                  aria-label={`${event.title} event reel`}
                >
                  <img
                    src={event.image}
                    alt={`${event.title} — fictional ${event.category.toLowerCase()} event`}
                    className={`reel-visual ${
                      isActive && playing ? "is-playing" : "is-paused"
                    }`}
                    style={{ objectPosition: event.imagePosition }}
                  />
                  <div className="reel-tint" />
                  <div
                    className="reel-progress"
                    aria-label="Simulated playback progress"
                  >
                    <span style={{ width: `${isActive ? progress : 0}%` }} />
                  </div>

                  <div className="reel-topbar">
                    <span className="demo-label">Demo</span>
                    <div>
                      <button
                        type="button"
                        onClick={() => setPlaying((current) => !current)}
                        aria-label={playing ? "Pause reel" : "Play reel"}
                      >
                        <Icon name={playing ? "pause" : "play"} size={19} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMuted((current) => !current)}
                        aria-label={muted ? "Unmute reel" : "Mute reel"}
                      >
                        <Icon name={muted ? "mute" : "volume"} size={20} />
                      </button>
                    </div>
                  </div>

                  {!playing && isActive && (
                    <button
                      type="button"
                      className="center-play"
                      onClick={() => setPlaying(true)}
                      aria-label="Resume reel"
                    >
                      <Icon name="play" size={30} />
                    </button>
                  )}

                  <div className="reel-bottom-shade" />

                  <div className="event-overlay">
                    <span className="event-category">{event.category}</span>
                    <h1>{event.title}</h1>
                    <div className="event-facts">
                      <span>
                        <Icon name="calendar" size={15} />
                        {event.date} · {event.time}
                      </span>
                      <span>
                        <Icon name="location" size={15} />
                        {event.venue}, {event.city}
                      </span>
                      <span>
                        <Icon name="ticket" size={15} />
                        {event.price}
                      </span>
                    </div>
                    <p>{event.caption}</p>
                    <div className="organizer-row">
                      <span className="organizer-avatar">{event.initials}</span>
                      <strong>{event.organizer}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          setFollowing((current) =>
                            current.includes(event.organizer)
                              ? current.filter(
                                  (name) => name !== event.organizer,
                                )
                              : [...current, event.organizer],
                          )
                        }
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="view-event-button"
                      onClick={() => setToast(`${event.title} details opened`)}
                    >
                      View event
                    </button>
                  </div>

                  <aside
                    className="action-rail"
                    aria-label={`Actions for ${event.title}`}
                  >
                    <button
                      type="button"
                      className={isLiked ? "is-liked" : ""}
                      onClick={() => toggleId(event.id, setLiked)}
                      aria-label={isLiked ? "Unlike event" : "Like event"}
                    >
                      <span>
                        <Icon name="heart" filled={isLiked} />
                      </span>
                      <small>
                        {formatCount(event.likes + (isLiked ? 1 : 0))}
                      </small>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentEvent(event)}
                      aria-label="Open comments"
                    >
                      <span>
                        <Icon name="comment" />
                      </span>
                      <small>
                        {formatCount(event.comments + extraComments)}
                      </small>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareEvent(event)}
                      aria-label="Share event"
                    >
                      <span>
                        <Icon name="share" />
                      </span>
                      <small>Share</small>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLink(event)}
                      aria-label="Copy event link"
                    >
                      <span>
                        <Icon name="link" />
                      </span>
                      <small>Copy</small>
                    </button>
                    <button
                      type="button"
                      className={isSaved ? "is-saved" : ""}
                      onClick={() => toggleId(event.id, setSaved)}
                      aria-label={isSaved ? "Remove saved event" : "Save event"}
                    >
                      <span>
                        <Icon name="bookmark" filled={isSaved} />
                      </span>
                      <small>{isSaved ? "Saved" : "Save"}</small>
                    </button>
                  </aside>
                </section>
              )
            })}
          </div>

          <div className="desktop-reel-nav" aria-label="Reel navigation">
            <button
              type="button"
              onClick={() => goToReel(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Previous reel"
            >
              <Icon name="chevron" />
            </button>
            <span>
              {activeIndex + 1} / {reels.length}
            </span>
            <button
              type="button"
              onClick={() => goToReel(activeIndex + 1)}
              disabled={activeIndex === reels.length - 1}
              aria-label="Next reel"
            >
              <Icon name="chevron" />
            </button>
          </div>
        </div>
      </main>

      {commentEvent && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setCommentEvent(null)
          }}
        >
          <section
            className="comments-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Comments"
          >
            <header>
              <div>
                <strong>Comments</strong>
                <span>{commentEvent.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setCommentEvent(null)}
                aria-label="Close comments"
              >
                <Icon name="close" />
              </button>
            </header>
            <div className="comments-list">
              {sampleComments.map((item) => (
                <article key={item.name}>
                  <span>{item.initials}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
              {(postedComments[commentEvent.id] ?? []).map((text, index) => (
                <article key={`${text}-${index}`}>
                  <span>YO</span>
                  <div>
                    <strong>You</strong>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
            <form onSubmit={postComment}>
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add a comment…"
                aria-label="Add a comment"
                autoFocus
              />
              <button type="submit" disabled={!comment.trim()}>
                Post
              </button>
            </form>
          </section>
        </div>
      )}

      {shareEvent && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShareEvent(null)
          }}
        >
          <section
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Share event"
          >
            <header>
              <div>
                <strong>Share event</strong>
                <span>{shareEvent.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setShareEvent(null)}
                aria-label="Close share menu"
              >
                <Icon name="close" />
              </button>
            </header>
            <div className="share-options">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareEvent.title} — ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                WA <span>WhatsApp</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(shareEvent.title)}&body=${encodeURIComponent(window.location.href)}`}
              >
                EM <span>Email</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  copyLink(shareEvent)
                  setShareEvent(null)
                }}
              >
                <Icon name="link" /> <span>Copy link</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className="reels-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
