import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { quickLinkStatuses } from 'core/constants'
import type { QuickLinkResponse } from 'core/types/quick-links'

type QuickLinkCardProps = {
  quickLink: QuickLinkResponse
  onEdit: () => void
  onDelete: () => void
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return 'Visit link'
  }
}

export default function QuickLinkCard({ quickLink, onEdit, onDelete }: QuickLinkCardProps) {
  return (
    <article className="list-row">
      <div className="list-dateline">
        <span>{format(new Date(quickLink.createdAt), 'MMM d, yyyy')}</span>
        <span aria-hidden="true">·</span>
        <span>{quickLink.category.name}</span>
        <Badge variant={quickLink.status === quickLinkStatuses.published ? 'default' : 'secondary'} className="dateline-badge">
          {quickLink.status}
        </Badge>
      </div>

      <div className="card-header-row">
        <h3 className="list-headline">{quickLink.title}</h3>
        <div className="card-actions">
          <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <p className="list-excerpt">{quickLink.excerpt}</p>

      <a href={quickLink.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-primary hover:underline">
        {getHostname(quickLink.url)}
      </a>
    </article>
  )
}
