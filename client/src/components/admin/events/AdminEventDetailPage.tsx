import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'

import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import ErrorAlert from '@/components/ErrorAlert'
import { ArticleSheetSkeleton } from '@/components/shared'
import ManifestSeal from '@/components/ManifestSeal'
import { DeleteDialog, EditDialog } from '@/components/events'
import { eventStatuses } from 'core/constants'
import type { EventDetailResponse, EventResponse } from 'core/types/events'

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState<EventResponse | null>(null)

  const event = useQuery({
    queryKey: ['events', Number(id)],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<EventDetailResponse>(`/events/${id}`, { signal })
      return data.event
    },
    enabled: id !== undefined,
  })

  const start = event.data ? new Date(event.data.startDate) : null
  const end = event.data ? new Date(event.data.endDate) : null
  const sameDay = start && end ? isSameDay(start, end) : true

  return (
    <div className="page-stack">
      <div className="row-between">
        <Link to="/admin/events" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
          <ArrowLeft />
          Back
        </Link>

        {event.isSuccess && (
          <div className="card-actions">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
              <Pencil />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDeleting(event.data)}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {event.isPending && <ArticleSheetSkeleton />}

      {event.isError && <ErrorAlert error={event.error} fallback="Failed to load event." />}

      {event.isSuccess && start && end && (
        <article className="article-sheet">
          <ManifestSeal className="article-seal" />

          <div className="article-dateline">
            <span>{format(start, 'MMM d, yyyy, h:mm a')}</span>
            <span aria-hidden="true">–</span>
            <span>{format(end, sameDay ? 'h:mm a' : 'MMM d, yyyy, h:mm a')}</span>
            <span aria-hidden="true">·</span>
            <span>{event.data.category.name}</span>
            <Badge variant={event.data.status === eventStatuses.published ? 'default' : 'secondary'} className="sm:ml-2">
              {event.data.status}
            </Badge>
          </div>

          <h1 className="article-title">{event.data.title}</h1>

          <div className="badge-row">
            <Badge variant="outline">{event.data.mode}</Badge>
            <span className="meta-text">{event.data.location}</span>
            <span className="meta-text">Posted by {event.data.postedBy.name}</span>
          </div>

          <p className="article-body">{event.data.excerpt}</p>
        </article>
      )}

      <EditDialog id={editing && id !== undefined ? Number(id) : null} onOpenChange={(open) => setEditing(open)} />

      <DeleteDialog event={deleting} onOpenChange={(open) => !open && setDeleting(null)} onDeleted={() => navigate('/admin/events')} />
    </div>
  )
}
