import { Megaphone } from 'lucide-react'

import { EmptyState, ListRowSkeleton } from '@/components/shared'
import type { AnnouncementResponse } from 'core/types/announcements'

import AnnouncementCard from './AnnouncementCard'

type AnnouncementListProps = {
  announcements: AnnouncementResponse[]
  onEdit: (announcement: AnnouncementResponse) => void
  onDelete: (announcement: AnnouncementResponse) => void
  isLoading?: boolean
  emptyMessage?: string
}

export default function AnnouncementList({ announcements, onEdit, onDelete, isLoading = false, emptyMessage = 'No announcements yet.' }: AnnouncementListProps) {
  if (isLoading) {
    return <ListRowSkeleton />
  }

  if (announcements.length === 0) {
    return <EmptyState icon={Megaphone} message={emptyMessage} />
  }

  return (
    <div className="list-stack">
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          onEdit={() => onEdit(announcement)}
          onDelete={() => onDelete(announcement)}
        />
      ))}
    </div>
  )
}
