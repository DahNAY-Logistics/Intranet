import { Link } from 'react-router'

import type { BlogPostSummary } from 'core/types/blogs'

import { postMeta } from './post-meta'

type BlogPostCardProps = {
  post: BlogPostSummary
  index: number
}

export default function BlogPostCard({ post, index }: BlogPostCardProps) {
  return (
    <article className="press-entry group">
      <div className="press-entry-head">
        <span className="press-number">{String(index).padStart(2, '0')}</span>
        <span aria-hidden="true" className="press-rule" />
        <span className="press-meta">{postMeta(post)}</span>
      </div>

      <Link to={`/blogs/${post.slug}`} className="press-headline">
        {post.title}
      </Link>

      <p className="press-excerpt">{post.custom_excerpt ?? post.excerpt}</p>
    </article>
  )
}
