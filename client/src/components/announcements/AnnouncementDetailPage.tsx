import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'

import { api } from '@/lib/api'
import ErrorAlert from '@/components/ErrorAlert'
import type { AnnouncementDetailResponse } from 'core/types/announcements'

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()

  const announcement = useQuery({
    queryKey: ['announcements', Number(id)],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<AnnouncementDetailResponse>(`/announcements/${id}`, { signal })
      return data.announcement
    },
    enabled: id !== undefined,
  })

  const postedAt = announcement.data ? new Date(announcement.data.createdAt) : null

  return (
    <div className="page-stack">
      <Link to="/announcements" className="home-back-link">
        <ArrowLeft className="size-3.5" />
        Back to bulletin
      </Link>

      {announcement.isPending && (
        <div className="bulletin-sheet sk-stack">
          <span className="sk-line w-28" />
          <span className="sk-line h-8 w-3/4" />
          <span className="sk-line w-16" />
          <span className="sk-line w-52" />
          <span className="sk-line w-full" />
          <span className="sk-line w-5/6" />
          <span className="sk-line w-2/3" />
        </div>
      )}

      {announcement.isError && <ErrorAlert error={announcement.error} fallback="Failed to load announcement." />}

      {announcement.isSuccess && postedAt && (
        <article className="bulletin-sheet">
          <span aria-hidden="true" className="bulletin-stamp">
            <span className="bulletin-stamp-month">{format(postedAt, 'MMM')}</span>
            <span className="bulletin-stamp-day">{format(postedAt, 'dd')}</span>
          </span>

          <span className="home-notice-tag">{announcement.data.category.name}</span>

          <h1 className="bulletin-sheet-title">{announcement.data.title}</h1>

          <span aria-hidden="true" className="bulletin-sheet-rule" />

          <p className="bulletin-sheet-meta">
            {format(postedAt, 'MMMM d, yyyy')} &middot; Posted by {announcement.data.postedBy.name}
          </p>

          <p className="bulletin-sheet-body">{announcement.data.excerpt}</p>
        </article>
      )}
    </div>
  )
}
