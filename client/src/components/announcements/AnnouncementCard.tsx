import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { announcementStatuses } from 'core/constants'
import type { AnnouncementResponse } from 'core/types/announcements'

type AnnouncementCardProps = {
  announcement: AnnouncementResponse
  onEdit: () => void
  onDelete: () => void
}

export default function AnnouncementCard({ announcement, onEdit, onDelete }: AnnouncementCardProps) {
  return (
    <article className="list-row">
      <div className="list-dateline">
        <span>{format(new Date(announcement.createdAt), 'MMM d, yyyy')}</span>
        <span aria-hidden="true">·</span>
        <span>{announcement.category.name}</span>
        <Badge
          variant={announcement.status === announcementStatuses.published ? 'default' : 'secondary'}
          className="dateline-badge"
        >
          {announcement.status}
        </Badge>
      </div>

      <div className="card-header-row">
        <Link to={`/admin/announcements/${announcement.id}`} className="list-headline-link">
          {announcement.title}
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

      <p className="list-excerpt">{announcement.excerpt}</p>

      <p className="meta-text">{announcement.postedBy.name}</p>
    </article>
  )
}
