import { useState } from 'react'
import { format } from 'date-fns'
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
import { DeleteDialog, EditDialog } from '@/components/announcements'
import { announcementStatuses } from 'core/constants'
import type { AnnouncementDetailResponse, AnnouncementResponse } from 'core/types/announcements'

export default function AdminAnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState<AnnouncementResponse | null>(null)

  const announcement = useQuery({
    queryKey: ['announcements', Number(id)],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<AnnouncementDetailResponse>(`/announcements/${id}`, { signal })
      return data.announcement
    },
    enabled: id !== undefined,
  })

  return (
    <div className="page-stack">
      <div className="row-between">
        <Link to="/admin/announcements" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
          <ArrowLeft />
          Back
        </Link>

        {announcement.isSuccess && (
          <div className="card-actions">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
              <Pencil />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDeleting(announcement.data)}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {announcement.isPending && <ArticleSheetSkeleton />}

      {announcement.isError && <ErrorAlert error={announcement.error} fallback="Failed to load announcement." />}

      {announcement.isSuccess && (
        <article className="article-sheet">
          <ManifestSeal className="article-seal" />

          <div className="article-dateline">
            <span>{format(new Date(announcement.data.createdAt), 'MMM d, yyyy')}</span>
            <span aria-hidden="true">·</span>
            <span>{announcement.data.category.name}</span>
            <Badge
              variant={announcement.data.status === announcementStatuses.published ? 'default' : 'secondary'}
              className="sm:ml-2"
            >
              {announcement.data.status}
            </Badge>
          </div>

          <h1 className="article-title">{announcement.data.title}</h1>

          <span className="meta-text">Posted by {announcement.data.postedBy.name}</span>

          <p className="article-body">{announcement.data.excerpt}</p>
        </article>
      )}

      <EditDialog id={editing && id !== undefined ? Number(id) : null} onOpenChange={(open) => setEditing(open)} />

      <DeleteDialog
        announcement={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => navigate('/admin/announcements')}
      />
    </div>
  )
}
