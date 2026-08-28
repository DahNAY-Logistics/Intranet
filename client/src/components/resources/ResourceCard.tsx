import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resourceStatuses } from 'core/constants'
import type { ResourceResponse } from 'core/types/resources'

type ResourceCardProps = {
  resource: ResourceResponse
  onEdit: () => void
  onDelete: () => void
}

export default function ResourceCard({ resource, onEdit, onDelete }: ResourceCardProps) {
  return (
    <article className="list-row">
      <div className="list-dateline">
        <span>{format(new Date(resource.createdAt), 'MMM d, yyyy')}</span>
        <span aria-hidden="true">·</span>
        <span>{resource.category.name}</span>
        <Badge variant={resource.status === resourceStatuses.published ? 'default' : 'secondary'} className="dateline-badge">
          {resource.status}
        </Badge>
      </div>

      <div className="card-header-row">
        <Link to={`/admin/resources/${resource.id}`} className="list-headline-link">
          {resource.title}
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

      <p className="list-excerpt">{resource.excerpt}</p>
    </article>
  )
}
