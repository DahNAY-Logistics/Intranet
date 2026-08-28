import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState, FeedPagination } from '@/components/shared'
import type { BlogsResponse } from 'core/types/blogs'

import BlogFeed from './BlogFeed'

const DEFAULT_PAGE_SIZE = 10

export default function BlogsPage() {
  const [page, setPage] = useState(1)

  const blogs = useQuery({
    queryKey: ['blogs', { page, pageSize: DEFAULT_PAGE_SIZE }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<BlogsResponse>('/blogs', {
        params: { page, pageSize: DEFAULT_PAGE_SIZE },
        signal,
      })
      return data
    },
  })

  return (
    <div className="page-stack">
      <div className="home-page-head">
        <p className="home-eyebrow">Dispatch</p>
        <h1 className="home-page-title">Blogs</h1>
      </div>

      {blogs.isError ? (
        <ErrorState error={blogs.error} fallback="Failed to load blog posts." tone="home" />
      ) : (
        <BlogFeed posts={blogs.data?.posts ?? []} isLoading={blogs.isPending} showLead={page === 1} />
      )}

      {blogs.isSuccess && blogs.data.totalCount > 0 && (
        <FeedPagination pagination={blogs.data} onPageChange={setPage} />
      )}
    </div>
  )
}
