import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/get-error-message'
import { linkSocial } from '@/lib/auth-client'
import { hasEnded, relativeDayLabel } from '@/lib/utils'
import { eventMessages } from 'core/messages'
import type { EventResponse, EventsActiveResponse } from 'core/types/events'

async function connectZohoCalendar() {
  const { error } = await linkSocial({ provider: 'zoho', callbackURL: '/home' })
  if (error) {
    toast.error('Could not connect to Zoho Calendar.')
  }
}

export default function MonthlyEvents() {
  const month = format(new Date(), 'yyyy-MM')

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'active', { month, sortOrder: 'asc' }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<EventsActiveResponse>('/events/active', {
        params: { month, sortOrder: 'asc' },
        signal,
      })
      return data
    },
  })

  const events = data?.events ?? []

  const addToCalendar = useMutation({
    mutationFn: async (event: EventResponse) => {
      await api.post(`/events/${event.id}/calendar`)
    },
    onSuccess: (_result, event) => {
      toast.success(eventMessages.ADDED_TO_CALENDAR(event.title))
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.data?.error === eventMessages.ZOHO_CALENDAR_NOT_CONNECTED) {
        void connectZohoCalendar()
        return
      }

      toast.error(getErrorMessage(error, 'Failed to add event to your calendar.'))
    },
  })

  return (
    <Card className="home-card">
      <CardHeader className="border-b border-(--home-line)">
        <div className="home-section-head">
          <span className="home-icon-chip">
            <CalendarDays className="size-4" />
          </span>
          <div>
            <p className="home-eyebrow">This month</p>
            <h2 className="home-section-title">Events</h2>
          </div>
        </div>
        <CardAction>
          <Link to="/events" className="home-section-link">
            View all
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="home-agenda-row sk-stack">
                <span aria-hidden="true" className="home-agenda-node" />
                <span className="sk-line w-28" />
                <span className="sk-line w-3/4" />
                <span className="sk-line w-1/2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState icon={CalendarDays} message="No events this month." tone="home" compact />
        ) : (
          <div className="home-list-scroll">
            <ul className="home-agenda-list">
              {events.map((event) => {
                const startDate = new Date(event.startDate)
                const ended = hasEnded(new Date(event.endDate))

                return (
                  <li key={event.id} className="home-agenda-row">
                    <span aria-hidden="true" className="home-agenda-node" />

                    <p className="home-agenda-when">
                      {relativeDayLabel(startDate)} &middot; {format(startDate, 'h:mm a')}
                    </p>

                    <Link to={`/events/${event.id}`} className="home-agenda-title">
                      {event.title}
                    </Link>

                    <p className="home-agenda-excerpt">{event.excerpt}</p>

                    <div className="home-agenda-meta">
                      <span className="home-agenda-mode">{event.mode}</span>
                      <span className="truncate">{event.location}</span>
                      {ended ? (
                        <span className="home-agenda-ended">Ended</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCalendar.mutate(event)}
                          className="home-feed-calendar-button"
                        >
                          <CalendarPlus className="size-3" />
                          Add to calendar
                        </button>
                      )}
                    </div>
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
