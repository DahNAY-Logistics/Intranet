import { useQuery } from '@tanstack/react-query'
import { Cake } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import { initials } from '@/lib/utils'
import type { BirthdaysResponse } from 'core/types/user-highlights'

export default function BirthdaysWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['users', 'highlights', 'birthdays'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<BirthdaysResponse>('/users/highlights/birthdays', { signal })
      return data
    },
  })

  const today = new Date()
  const birthdays = data?.birthdays ?? []
  const celebrating = birthdays.filter(
    (entry) => entry.month === today.getMonth() + 1 && entry.day === today.getDate(),
  )
  const upcoming = birthdays.filter(
    (entry) => !(entry.month === today.getMonth() + 1 && entry.day === today.getDate()),
  )

  return (
    <Card className="home-card">
      <CardHeader className="border-b border-(--home-line)">
        <div className="home-section-head">
          <span className="home-icon-chip">
            <Cake className="size-4" />
          </span>
          <div>
            <p className="home-eyebrow">Celebrate</p>
            <h2 className="home-section-title">Birthdays this month</h2>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-1.5">
                <span className="sk-circle size-9 shrink-0" />
                <span className="sk-stack flex-1">
                  <span className="sk-line w-32" />
                  <span className="sk-line w-20" />
                </span>
              </div>
            ))}
          </div>
        ) : birthdays.length === 0 ? (
          <EmptyState icon={Cake} message="No birthdays this month." tone="home" compact />
        ) : (
          <div className="home-list-scroll">
            <div className="home-cake-stack">
              {celebrating.map((entry) => (
                <div key={entry.id} className="home-cake-today">
                  <Avatar size="sm">
                    <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="home-cake-today-label">Today</p>
                    <p className="home-cake-today-name">{entry.name}</p>
                  </div>
                  <Cake className="size-4 shrink-0 text-(--home-signal)" />
                </div>
              ))}

              {upcoming.length > 0 && (
                <div className="home-cake-cloud">
                  {upcoming.map((entry) => (
                    <span key={entry.id} className="home-cake-chip">
                      <span className="home-cake-chip-day">{entry.day}</span>
                      <span className="home-cake-chip-name">{entry.name}</span>
                      {entry.department && (
                        <span className="home-cake-chip-dept">{entry.department.name}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
