import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState, FeedPagination } from '@/components/shared'
import type { ResourcesResponse } from 'core/types/resources'

import ResourceFeed from './ResourceFeed'

const DEFAULT_PAGE_SIZE = 10

export default function ResourcesPage() {
  const [page, setPage] = useState(1)

  const resources = useQuery({
    queryKey: ['resources', { page, pageSize: DEFAULT_PAGE_SIZE }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<ResourcesResponse>('/resources', {
        params: { page, pageSize: DEFAULT_PAGE_SIZE },
        signal,
      })
      return data
    },
  })

  return (
    <div className="page-stack">
      <div className="home-page-head">
        <p className="home-eyebrow">Reference Library</p>
        <h1 className="home-page-title">Resources</h1>
      </div>

      {resources.isError ? (
        <ErrorState error={resources.error} fallback="Failed to load resources." tone="home" />
      ) : (
        <ResourceFeed resources={resources.data?.resources ?? []} isLoading={resources.isPending} />
      )}

      {resources.isSuccess && resources.data.totalCount > 0 && (
        <FeedPagination pagination={resources.data} onPageChange={setPage} />
      )}
    </div>
  )
}
