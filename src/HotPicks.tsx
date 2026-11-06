type HotPick = {
  id: string
  title: string
  category: string
  image: string
  weekday: string
  day: string
  month: string
  time: string
  venue: string
  area: string
  startsAt: Date | null
  endsAt: Date | null
}

export function HotPicksBoard<T extends HotPick>({ events, onOpen }: { events: T[]; onOpen: (event: T) => void }) {
  if (!events.length) return null
  const now = new Date()
  return (
    <section className="hot-picks" aria-label="Hot picks near you">
      <div className="hot-picks-heading">
        <div>
          <p className="eyebrow"><span />Hot picks</p>
          <h2>Top events near you</h2>
        </div>
        <span className="hot-picks-hint">Swipe to explore →</span>
      </div>
      <div className="hot-picks-track">
        {events.map((event) => {
          const happeningNow = Boolean(event.startsAt && event.endsAt && now >= event.startsAt && now <= event.endsAt)
          return (
            <button className="hot-pick-card" type="button" key={event.id} onClick={() => onOpen(event)}>
              <span className="hot-pick-image-wrap">
                <img src={event.image} alt="" />
                <span className="hot-pick-category">{event.category}</span>
                {happeningNow && <span className="hot-pick-live">Happening now</span>}
              </span>
              <span className="hot-pick-body">
                <strong>{event.title}</strong>
                <span>{event.weekday} {event.day} {event.month} · {event.time}</span>
                <span>
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {event.venue}{event.area ? `, ${event.area}` : ""}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
