import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, GalleryHorizontal, Link2, Megaphone } from 'lucide-react'

import { api } from '@/lib/api'
import { ErrorState } from '@/components/shared'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStatsResponse } from 'core/types/dashboard'

import StatCard from './StatCard'

export default function DashboardStats() {
  const stats = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<DashboardStatsResponse>('/dashboard/stats', { signal })
      return data
    },
  })

  if (stats.isPending) {
    return (
      <div className="card-grid xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-3 w-28 rounded-full" />
              </CardTitle>
              <CardAction>
                <Skeleton className="size-4 rounded-sm" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-14 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (stats.isError) {
    return <ErrorState error={stats.error} fallback="Failed to load dashboard stats." />
  }

  const cards = [
    { label: 'Published Announcements', value: stats.data.publishedAnnouncements, icon: Megaphone },
    { label: 'Published Events', value: stats.data.publishedEvents, icon: CalendarDays },
    { label: 'Total Quick Links', value: stats.data.totalQuickLinks, icon: Link2 },
    { label: 'Total Banners', value: stats.data.totalBanners, icon: GalleryHorizontal },
    { label: 'Total Resources', value: stats.data.totalResources, icon: BookOpen },
  ]

  return (
    <div className="card-grid xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
