import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Image as ImageIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { BannerResponse } from 'core/types/banners'

import BannerCard from './BannerCard'

type BannerGridProps = {
  banners: BannerResponse[]
  onEdit: (banner: BannerResponse) => void
  onDelete: (banner: BannerResponse) => void
  sortable?: boolean
  isLoading?: boolean
  emptyMessage?: string
}

interface SortableCardProps {
  banner: BannerResponse
  onEdit: () => void
  onDelete: () => void
  order: number
}

function SortableCard({ banner, onEdit, onDelete, order }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BannerCard
        banner={banner}
        onEdit={onEdit}
        onDelete={onDelete}
        order={order}
        dragHandle={{ attributes, listeners }}
      />
    </div>
  )
}

export default function BannerGrid({ banners, onEdit, onDelete, sortable = false, isLoading = false, emptyMessage = 'No banners yet.' }: BannerGridProps) {
  if (isLoading) {
    return (
      <div className="card-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="gap-0 py-0 overflow-hidden">
            <Skeleton className="aspect-2.5/1 w-full rounded-none" />
            <div className="card-body pt-3 pb-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-full rounded-full" />
                <Skeleton className="h-3.5 w-3/4 rounded-full" />
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-3 w-32 rounded-full" />
                </div>
                <div className="card-actions">
                  <Skeleton className="skeleton-action" />
                  <Skeleton className="skeleton-action" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (banners.length === 0) {
    return <EmptyState icon={ImageIcon} message={emptyMessage} />
  }

  return (
    <div className="card-grid">
      {banners.map((banner, index) =>
        sortable ? (
          <SortableCard
            key={banner.id}
            banner={banner}
            order={index + 1}
            onEdit={() => onEdit(banner)}
            onDelete={() => onDelete(banner)}
          />
        ) : (
          <BannerCard key={banner.id} banner={banner} onEdit={() => onEdit(banner)} onDelete={() => onDelete(banner)} />
        ),
      )}
    </div>
  )
}
