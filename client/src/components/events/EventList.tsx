import { CalendarDays } from 'lucide-react'

import { EmptyState, ListRowSkeleton } from '@/components/shared'
import type { EventResponse } from 'core/types/events'

import EventCard from './EventCard'

type EventListProps = {
  events: EventResponse[]
  onEdit: (event: EventResponse) => void
  onDelete: (event: EventResponse) => void
  isLoading?: boolean
  emptyMessage?: string
}

export default function EventList({ events, onEdit, onDelete, isLoading = false, emptyMessage = 'No events yet.' }: EventListProps) {
  if (isLoading) {
    return <ListRowSkeleton metaWidth="w-40" />
  }

  if (events.length === 0) {
    return <EmptyState icon={CalendarDays} message={emptyMessage} />
  }

  return (
    <div className="list-stack">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onEdit={() => onEdit(event)} onDelete={() => onDelete(event)} />
      ))}
    </div>
  )
}
