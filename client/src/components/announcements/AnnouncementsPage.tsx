import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState, FeedPagination } from '@/components/shared'
import type { AnnouncementsResponse } from 'core/types/announcements'

import AnnouncementFeed from './AnnouncementFeed'

const DEFAULT_PAGE_SIZE = 10

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1)

  const announcements = useQuery({
    queryKey: ['announcements', { page, pageSize: DEFAULT_PAGE_SIZE }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<AnnouncementsResponse>('/announcements', {
        params: { page, pageSize: DEFAULT_PAGE_SIZE },
        signal,
      })
      return data
    },
  })

  return (
    <div className="page-stack">
      <div className="home-page-head">
        <p className="home-eyebrow">Bulletin</p>
        <h1 className="home-page-title">Announcements</h1>
      </div>

      {announcements.isError ? (
        <ErrorState error={announcements.error} fallback="Failed to load announcements." tone="home" />
      ) : (
        <AnnouncementFeed announcements={announcements.data?.announcements ?? []} isLoading={announcements.isPending} />
      )}

      {announcements.isSuccess && announcements.data.totalCount > 0 && (
        <FeedPagination pagination={announcements.data} onPageChange={setPage} />
      )}
    </div>
  )
}
