import { Newspaper } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/shared'
import type { BlogPostSummary } from 'core/types/blogs'

import BlogPostCard from './BlogPostCard'
import { postMeta } from './post-meta'

type BlogFeedProps = {
  posts: BlogPostSummary[]
  isLoading?: boolean
  showLead?: boolean
  emptyMessage?: string
}

export default function BlogFeed({
  posts,
  isLoading = false,
  showLead = true,
  emptyMessage = 'No blog posts yet.',
}: BlogFeedProps) {
  if (isLoading) {
    return (
      <div className="press-stack">
        <div className="press-lead">
          <div className="press-figure sk-block rounded-lg" />
          <div className="press-lead-body sk-stack">
            <span className="sk-line w-24" />
            <span className="sk-line h-7 w-4/5" />
            <span className="sk-line w-40" />
            <span className="sk-line w-full" />
            <span className="sk-line w-2/3" />
          </div>
        </div>

        <div className="press-index">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="press-entry sk-stack">
              <span className="sk-line w-full" />
              <span className="sk-line h-5 w-3/4" />
              <span className="sk-line w-5/6" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return <EmptyState icon={Newspaper} message={emptyMessage} tone="home" />
  }

  const [lead, ...rest] = posts
  const indexed = showLead && lead ? rest : posts

  return (
    <div className="press-stack">
      {showLead && lead && (
        <article className="press-lead group">
          {lead.feature_image && (
            <div className="press-figure">
              <img src={lead.feature_image} alt={lead.title ?? ''} className="press-image" />
            </div>
          )}

          <div className="press-lead-body">
            <p className="press-kicker">Lead story</p>

            <Link to={`/blogs/${lead.slug}`} className="press-lead-headline">
              {lead.title}
            </Link>

            <p className="press-meta">{postMeta(lead)}</p>

            <p className="press-lead-excerpt">{lead.custom_excerpt ?? lead.excerpt}</p>
          </div>
        </article>
      )}

      <div className="press-index">
        {indexed.map((post, index) => (
          <BlogPostCard key={post.id} post={post} index={showLead && lead ? index + 2 : index + 1} />
        ))}
      </div>
    </div>
  )
}
