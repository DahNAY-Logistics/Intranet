import { useQuery } from '@tanstack/react-query'
import { Newspaper } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState, ErrorState } from '@/components/shared'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import { postMeta } from '@/components/blogs/post-meta'
import type { BlogsResponse } from 'core/types/blogs'

const WIDGET_PAGE_SIZE = 3

export default function LatestBlogPosts() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['blogs', { pageSize: WIDGET_PAGE_SIZE }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<BlogsResponse>('/blogs', { params: { pageSize: WIDGET_PAGE_SIZE }, signal })
      return data
    },
  })

  const posts = data?.posts ?? []

  return (
    <Card className="home-card">
      <CardHeader className="border-b border-(--home-line)">
        <div className="home-section-head">
          <span className="home-icon-chip">
            <Newspaper className="size-4" />
          </span>
          <div>
            <p className="home-eyebrow">From the team</p>
            <h2 className="home-section-title">Latest blog posts</h2>
          </div>
        </div>
        <CardAction>
          <Link to="/blogs" className="home-section-link">
            View all
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="home-press-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="home-press-entry sk-stack">
                <span className="sk-line w-full" />
                <span className="sk-line h-4 w-3/4" />
                <span className="sk-line w-5/6" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} fallback="Failed to load blog posts." tone="home" compact />
        ) : posts.length === 0 ? (
          <EmptyState icon={Newspaper} message="No blog posts yet." tone="home" compact />
        ) : (
          <div className="home-press-list">
            {posts.map((post, index) => (
              <Link key={post.id} to={`/blogs/${post.slug}`} className="home-press-entry group">
                <span className="home-press-entry-head">
                  <span className="home-press-number">{String(index + 1).padStart(2, '0')}</span>
                  <span aria-hidden="true" className="home-press-rule" />
                  <span className="home-press-meta">{postMeta(post)}</span>
                </span>

                <h3 className="home-press-headline">{post.title}</h3>
                <p className="home-press-excerpt">{post.custom_excerpt ?? post.excerpt}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
