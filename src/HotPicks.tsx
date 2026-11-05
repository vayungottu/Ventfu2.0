import type { AppEvent } from "./App"
import { Icon } from "./App"

export function HotPicksBoard({ events, onOpen }: { events: AppEvent[]; onOpen: (event: AppEvent) => void }) {
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
          const happeningNow = event.startsAt && event.endsAt && now >= event.startsAt && now <= event.endsAt
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
                <span><Icon name="location" size={14} />{event.venue}{event.area ? `, ${event.area}` : ""}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
