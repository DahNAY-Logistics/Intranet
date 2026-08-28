import { format, isSameDay } from 'date-fns'
import { Link } from 'react-router'

import { hasEnded, relativeDayLabel } from '@/lib/utils'
import type { EventResponse } from 'core/types/events'

type EventFeedCardProps = {
  event: EventResponse
}

export default function EventFeedCard({ event }: EventFeedCardProps) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const sameDay = isSameDay(start, end)
  const ended = hasEnded(end)

  return (
    <article className="timetable-row">
      <span aria-hidden="true" className="timetable-node" />

      <div className="timetable-main">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="timetable-when">{ended ? 'Ended' : relativeDayLabel(start)}</p>
          <p className="timetable-clock">
            {format(start, 'EEE d MMM, h:mm a')} &ndash; {format(end, sameDay ? 'h:mm a' : 'EEE d MMM, h:mm a')}
          </p>
        </div>

        <Link to={`/events/${event.id}`} className="timetable-headline">
          {event.title}
        </Link>

        <p className="timetable-excerpt">{event.excerpt}</p>
      </div>

      <div className="timetable-side">
        <span className="timetable-tag">{event.category.name}</span>
        <span className="timetable-mode">{event.mode}</span>
        <span className="line-clamp-2">{event.location}</span>
      </div>
    </article>
  )
}
