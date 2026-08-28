import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'

import { api } from '@/lib/api'
import ErrorAlert from '@/components/ErrorAlert'
import type { BlogPostResponse } from 'core/types/blogs'

import BlogMarkdownContent from './BlogMarkdownContent'
import { postMeta } from './post-meta'

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const post = useQuery({
    queryKey: ['blogs', slug],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<BlogPostResponse>(`/blogs/${slug}`, { signal })
      return data.post
    },
    enabled: slug !== undefined,
  })

  return (
    <div className="page-stack">
      <Link to="/blogs" className="home-back-link">
        <ArrowLeft className="size-3.5" />
        Back to dispatch
      </Link>

      {post.isPending && (
        <div className="press-sheet">
          <div className="press-sheet-figure sk-block rounded-lg" />
          <div className="press-sheet-head sk-stack">
            <span className="sk-line w-24" />
            <span className="sk-line h-9 w-4/5" />
            <span className="sk-line w-44" />
          </div>
          <div className="sk-stack">
            <span className="sk-line w-full" />
            <span className="sk-line w-full" />
            <span className="sk-line w-3/4" />
          </div>
        </div>
      )}

      {post.isError && <ErrorAlert error={post.error} fallback="Failed to load blog post." />}

      {post.isSuccess && (
        <article className="press-sheet">
          {post.data.feature_image && (
            <div className="press-sheet-figure">
              <img src={post.data.feature_image} alt={post.data.title ?? ''} className="press-image" />
            </div>
          )}

          <div className="press-sheet-head">
            <p className="press-kicker">Dispatch</p>

            <h1 className="press-sheet-title">{post.data.title}</h1>

            <p className="press-meta">{postMeta(post.data)}</p>
          </div>

          <div className="press-sheet-body">
            <BlogMarkdownContent value={post.data.content} />
          </div>
        </article>
      )}
    </div>
  )
}
