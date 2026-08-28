import { Megaphone } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import type { AnnouncementResponse } from 'core/types/announcements'

import AnnouncementFeedCard from './AnnouncementFeedCard'

type AnnouncementFeedProps = {
  announcements: AnnouncementResponse[]
  isLoading?: boolean
  emptyMessage?: string
}

export default function AnnouncementFeed({ announcements, isLoading = false, emptyMessage = 'No announcements yet.' }: AnnouncementFeedProps) {
  if (isLoading) {
    return (
      <div className="bulletin-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bulletin-row">
            <div className="bulletin-date">
              <span className="sk-line w-6" />
            </div>
            <div className="bulletin-body sk-stack">
              <span className="sk-line w-24" />
              <span className="sk-line h-5 w-3/4" />
              <span className="sk-line w-full" />
              <span className="sk-line w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (announcements.length === 0) {
    return <EmptyState icon={Megaphone} message={emptyMessage} tone="home" />
  }

  return (
    <div className="bulletin-list">
      {announcements.map((announcement) => (
        <AnnouncementFeedCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  )
}
