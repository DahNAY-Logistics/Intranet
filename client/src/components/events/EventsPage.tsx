import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState, FeedPagination } from '@/components/shared'
import type { EventsResponse } from 'core/types/events'

import EventFeed from './EventFeed'

const DEFAULT_PAGE_SIZE = 10

export default function EventsPage() {
  const [page, setPage] = useState(1)

  const events = useQuery({
    queryKey: ['events', { page, pageSize: DEFAULT_PAGE_SIZE, sortOrder: 'desc' }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<EventsResponse>('/events', {
        params: { page, pageSize: DEFAULT_PAGE_SIZE, sortOrder: 'desc' },
        signal,
      })
      return data
    },
  })

  return (
    <div className="page-stack">
      <div className="home-page-head">
        <p className="home-eyebrow">Calendar of Record</p>
        <h1 className="home-page-title">Events</h1>
      </div>

      {events.isError ? (
        <ErrorState error={events.error} fallback="Failed to load events." tone="home" />
      ) : (
        <EventFeed events={events.data?.events ?? []} isLoading={events.isPending} />
      )}

      {events.isSuccess && events.data.totalCount > 0 && (
        <FeedPagination pagination={events.data} onPageChange={setPage} />
      )}
    </div>
  )
}
