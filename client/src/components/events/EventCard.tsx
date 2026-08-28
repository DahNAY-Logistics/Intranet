import { format, isSameDay } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { eventStatuses } from 'core/constants'
import type { EventResponse } from 'core/types/events'

type EventCardProps = {
  event: EventResponse
  onEdit: () => void
  onDelete: () => void
}

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const sameDay = isSameDay(start, end)

  return (
    <article className="list-row">
      <div className="list-dateline">
        <span>{format(start, 'MMM d, yyyy, h:mm a')}</span>
        <span aria-hidden="true">–</span>
        <span>{format(end, sameDay ? 'h:mm a' : 'MMM d, yyyy, h:mm a')}</span>
        <span aria-hidden="true">·</span>
        <span>{event.category.name}</span>
        <Badge variant={event.status === eventStatuses.published ? 'default' : 'secondary'} className="dateline-badge">
          {event.status}
        </Badge>
      </div>

      <div className="card-header-row">
        <Link to={`/admin/events/${event.id}`} className="list-headline-link">
          {event.title}
        </Link>
        <div className="card-actions">
          <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <p className="list-excerpt">{event.excerpt}</p>

      <p className="meta-text">
        <span>{event.mode}</span> · <span>{event.location}</span>
      </p>
    </article>
  )
}
