import { format } from 'date-fns'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { bannerStatuses } from 'core/constants'
import type { BannerResponse } from 'core/types/banners'

type BannerCardProps = {
  banner: BannerResponse
  onEdit: () => void
  onDelete: () => void
  order?: number
  dragHandle?: {
    attributes: DraggableAttributes
    listeners: DraggableSyntheticListeners
  }
}

export default function BannerCard({ banner, onEdit, onDelete, order, dragHandle }: BannerCardProps) {
  return (
    <Card className="gap-0 py-0">
      <div className="relative">
        <img src={banner.attachment.url} alt="" className="aspect-2.5/1 w-full object-cover" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          {order !== undefined ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
              {order}
            </span>
          ) : (
            <span />
          )}

          {dragHandle && (
            <button
              type="button"
              className="flex size-7 cursor-grab touch-none items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm hover:text-foreground"
              onClick={(event) => event.stopPropagation()}
              {...dragHandle.attributes}
              {...dragHandle.listeners}
            >
              <GripVertical className="size-4" />
            </button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/35 to-transparent p-3 pt-8">
          <div className="badge-row">
            <Badge variant={banner.status === bannerStatuses.published ? 'default' : 'secondary'}>
              {banner.status}
            </Badge>
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur-sm">
              {banner.category.name}
            </Badge>
          </div>
          <h3 className="card-title mt-1 truncate text-white">
            <Link to={`/admin/banners/${banner.id}`} className="hover:underline">
              {banner.title}
            </Link>
          </h3>
        </div>
      </div>

      <div className="card-body pt-3 pb-4">
        <p className="card-excerpt">{banner.excerpt}</p>

        <div className="flex items-end justify-between gap-2">
          <div className="meta-text space-y-0.5">
            <p>{banner.postedBy.name}</p>
            <p>
              {format(new Date(banner.startDate), 'MMM d')} – {format(new Date(banner.endDate), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="card-actions">
            <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
