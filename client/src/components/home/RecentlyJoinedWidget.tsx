import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays } from 'date-fns'
import { UserPlus } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import { initials } from '@/lib/utils'
import type { RecentlyJoinedResponse } from 'core/types/user-highlights'

function tenureLabel(joinedDate: Date) {
  const days = differenceInCalendarDays(new Date(), joinedDate)

  if (days <= 0) return 'Joined today'
  if (days === 1) return 'Joined yesterday'
  if (days < 14) return `${days} days in`

  return `${Math.floor(days / 7)} weeks in`
}

export default function RecentlyJoinedWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['users', 'highlights', 'recently-joined'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<RecentlyJoinedResponse>('/users/highlights/recently-joined', { signal })
      return data
    },
  })

  const recentlyJoined = data?.recentlyJoined ?? []

  return (
    <Card className="home-card">
      <CardHeader className="border-b border-(--home-line)">
        <div className="home-section-head">
          <span className="home-icon-chip">
            <UserPlus className="size-4" />
          </span>
          <div>
            <p className="home-eyebrow">Welcome</p>
            <h2 className="home-section-title">Recently joined</h2>
          </div>
        </div>
        <CardAction>
          <Link to="/directory?sortBy=joinedDate&sortOrder=desc" className="home-section-link">
            Directory
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <span className="sk-circle size-11" />
                <span className="sk-line w-16" />
                <span className="sk-line w-12" />
              </div>
            ))}
          </div>
        ) : recentlyJoined.length === 0 ? (
          <EmptyState icon={UserPlus} message="No one has joined this month yet." tone="home" compact />
        ) : (
          <div className="home-list-scroll">
            <div className="home-welcome-grid">
              {recentlyJoined.map((entry) => (
                <div key={entry.id} className="home-welcome-person">
                  <span className="home-welcome-ring">
                    <Avatar size="sm">
                      <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                    </Avatar>
                  </span>
                  <p className="home-welcome-name">{entry.name}</p>
                  {entry.department && <p className="home-welcome-dept">{entry.department.name}</p>}
                  <p className="home-welcome-tenure">{tenureLabel(new Date(entry.joinedDate))}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
