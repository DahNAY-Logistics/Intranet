import { format } from 'date-fns'

import type { BlogPostSummary } from 'core/types/blogs'

export function postMeta(post: BlogPostSummary) {
  const parts = []

  if (post.published_at) parts.push(format(new Date(post.published_at), 'dd MMM yyyy'))
  if (post.reading_time) parts.push(`${post.reading_time} min read`)

  return parts.join(' · ')
}
