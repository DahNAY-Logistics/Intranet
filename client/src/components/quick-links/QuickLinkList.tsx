import { Link2 } from 'lucide-react'

import { EmptyState, ListRowSkeleton } from '@/components/shared'
import type { QuickLinkResponse } from 'core/types/quick-links'

import QuickLinkCard from './QuickLinkCard'

type QuickLinkListProps = {
  quickLinks: QuickLinkResponse[]
  onEdit: (quickLink: QuickLinkResponse) => void
  onDelete: (quickLink: QuickLinkResponse) => void
  isLoading?: boolean
  emptyMessage?: string
}

export default function QuickLinkList({
  quickLinks,
  onEdit,
  onDelete,
  isLoading = false,
  emptyMessage = 'No quick links yet.',
}: QuickLinkListProps) {
  if (isLoading) {
    return <ListRowSkeleton metaWidth="w-32" />
  }

  if (quickLinks.length === 0) {
    return <EmptyState icon={Link2} message={emptyMessage} />
  }

  return (
    <div className="list-stack">
      {quickLinks.map((quickLink) => (
        <QuickLinkCard
          key={quickLink.id}
          quickLink={quickLink}
          onEdit={() => onEdit(quickLink)}
          onDelete={() => onDelete(quickLink)}
        />
      ))}
    </div>
  )
}
