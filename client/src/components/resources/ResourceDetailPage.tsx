import { format } from 'date-fns'
import { ArrowLeft, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'

import { api } from '@/lib/api'
import ErrorAlert from '@/components/ErrorAlert'
import type { ResourceDetailResponse } from 'core/types/resources'

import MarkdownContent from './MarkdownContent'

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()

  const resource = useQuery({
    queryKey: ['resources', Number(id)],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<ResourceDetailResponse>(`/resources/${id}`, { signal })
      return data.resource
    },
    enabled: id !== undefined,
  })

  return (
    <div className="page-stack">
      <Link to="/resources" className="home-back-link">
        <ArrowLeft className="size-3.5" />
        Back to library
      </Link>

      {resource.isPending && (
        <div className="library-sheet">
          <div className="library-sheet-head sk-stack">
            <span className="sk-line w-56" />
            <span className="sk-line h-8 w-3/4" />
          </div>
          <span className="sk-line w-full" />
          <span className="sk-line w-5/6" />
          <span className="sk-block h-11 w-40 rounded-md" />
          <span className="sk-line w-full" />
          <span className="sk-line w-2/3" />
        </div>
      )}

      {resource.isError && <ErrorAlert error={resource.error} fallback="Failed to load resource." />}

      {resource.isSuccess && (
        <article className="library-sheet">
          <div className="library-sheet-head">
            <div className="library-sheet-meta">
              <span className="library-cat">{resource.data.category.name}</span>
              <span>{format(new Date(resource.data.createdAt), 'dd MMM yyyy')}</span>
              <span>Posted by {resource.data.postedBy.name}</span>
            </div>

            <h1 className="library-sheet-title">{resource.data.title}</h1>
          </div>

          <p className="library-lead">{resource.data.excerpt}</p>

          {resource.data.url && (
            <a href={resource.data.url} target="_blank" rel="noopener noreferrer" className="library-download">
              <Download className="size-4 shrink-0" />
              Download
            </a>
          )}

          <div className="library-content">
            <MarkdownContent value={resource.data.content} />
          </div>
        </article>
      )}
    </div>
  )
}
