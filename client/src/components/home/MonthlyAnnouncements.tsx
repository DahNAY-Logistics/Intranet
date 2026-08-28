import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Megaphone } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/shared'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import type { AnnouncementsActiveResponse } from 'core/types/announcements'

export default function MonthlyAnnouncements() {
  const month = format(new Date(), 'yyyy-MM')

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', 'active', { month }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<AnnouncementsActiveResponse>('/announcements/active', {
        params: { month },
        signal,
      })
      return data
    },
  })

  const announcements = data?.announcements ?? []

  return (
    <Card className="home-card">
      <CardHeader className="border-b border-(--home-line)">
        <div className="home-section-head">
          <span className="home-icon-chip">
            <Megaphone className="size-4" />
          </span>
          <div>
            <p className="home-eyebrow">This month</p>
            <h2 className="home-section-title">Announcements</h2>
          </div>
        </div>
        <CardAction>
          <Link to="/announcements" className="home-section-link">
            View all
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 py-2.5">
                <span className="sk-block size-10 shrink-0 rounded-md" />
                <span className="sk-stack flex-1">
                  <span className="sk-line w-20" />
                  <span className="sk-line w-3/4" />
                </span>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState icon={Megaphone} message="No announcements this month." tone="home" compact />
        ) : (
          <div className="home-list-scroll">
            <ul className="home-notice-list">
              {announcements.map((announcement) => {
                const postedAt = new Date(announcement.createdAt)

                return (
                  <li key={announcement.id} className="home-notice-row">
                    <span className="home-notice-date">
                      <span className="home-notice-month">{format(postedAt, 'MMM')}</span>
                      <span className="home-notice-day">{format(postedAt, 'dd')}</span>
                    </span>

                    <span className="home-notice-body">
                      <Link to={`/announcements/${announcement.id}`} className="home-notice-title">
                        {announcement.title}
                      </Link>
                      <p className="home-notice-excerpt">{announcement.excerpt}</p>
                      <span className="home-notice-tag">{announcement.category.name}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
