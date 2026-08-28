import { CalendarDays } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import type { EventResponse } from 'core/types/events'

import EventFeedCard from './EventFeedCard'

type EventFeedProps = {
  events: EventResponse[]
  isLoading?: boolean
  emptyMessage?: string
}

export default function EventFeed({ events, isLoading = false, emptyMessage = 'No events yet.' }: EventFeedProps) {
  if (isLoading) {
    return (
      <div className="timetable-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="timetable-row">
            <span aria-hidden="true" className="timetable-node" />
            <div className="timetable-main sk-stack">
              <span className="sk-line w-40" />
              <span className="sk-line h-5 w-2/3" />
              <span className="sk-line w-full" />
            </div>
            <div className="timetable-side sk-stack">
              <span className="sk-line w-24" />
              <span className="sk-line w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return <EmptyState icon={CalendarDays} message={emptyMessage} tone="home" />
  }

  return (
    <div className="timetable-list">
      {events.map((event) => (
        <EventFeedCard key={event.id} event={event} />
      ))}
    </div>
  )
}
