import axios from 'axios'
import { format, isSameDay } from 'date-fns'
import { ArrowLeft, CalendarPlus, CalendarX } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { linkSocial } from '@/lib/auth-client'
import { getErrorMessage } from '@/lib/get-error-message'
import { hasEnded, relativeDayLabel } from '@/lib/utils'
import ErrorAlert from '@/components/ErrorAlert'
import { eventMessages } from 'core/messages'
import type { EventDetailResponse } from 'core/types/events'

async function connectZohoCalendar(callbackURL: string) {
  const { error } = await linkSocial({ provider: 'zoho', callbackURL })
  if (error) {
    toast.error('Could not connect to Zoho Calendar.')
  }
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()

  const event = useQuery({
    queryKey: ['events', Number(id)],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<EventDetailResponse>(`/events/${id}`, { signal })
      return data.event
    },
    enabled: id !== undefined,
  })

  const addToCalendar = useMutation({
    mutationFn: async () => {
      await api.post(`/events/${id}/calendar`)
    },
    onSuccess: () => {
      toast.success(eventMessages.ADDED_TO_CALENDAR(event.data?.title ?? 'Event'))
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.data?.error === eventMessages.ZOHO_CALENDAR_NOT_CONNECTED) {
        void connectZohoCalendar(`/events/${id}`)
        return
      }

      toast.error(getErrorMessage(error, 'Failed to add event to your calendar.'))
    },
  })

  const start = event.data ? new Date(event.data.startDate) : null
  const end = event.data ? new Date(event.data.endDate) : null
  const sameDay = start && end ? isSameDay(start, end) : false
  const ended = end ? hasEnded(end) : false

  return (
    <div className="page-stack">
      <Link to="/events" className="home-back-link">
        <ArrowLeft className="size-3.5" />
        Back to calendar
      </Link>

      {event.isPending && (
        <div className="timetable-sheet">
          <div className="timetable-stub">
            <div className="timetable-stub-date">
              <span className="sk-block size-12 rounded-md" />
              <span className="timetable-stub-lines sk-stack">
                <span className="sk-line w-28" />
                <span className="sk-line w-40" />
              </span>
            </div>
            <span className="sk-line w-20" />
          </div>
          <div className="timetable-body sk-stack w-full">
            <span className="sk-line w-24" />
            <span className="sk-line h-8 w-3/4" />
            <div className="timetable-facts">
              <span className="sk-line w-24" />
              <span className="sk-line w-24" />
              <span className="sk-line w-24" />
            </div>
            <span className="sk-line w-full" />
            <span className="sk-line w-4/5" />
          </div>
        </div>
      )}

      {event.isError && <ErrorAlert error={event.error} fallback="Failed to load event." />}

      {event.isSuccess && start && end && (
        <article className="timetable-sheet">
          <div className="timetable-stub">
            <div className="timetable-stub-date">
              <span className="timetable-stub-day">{format(start, 'dd')}</span>
              <span className="timetable-stub-lines">
                <span className="timetable-stub-month">{format(start, 'MMMM yyyy')}</span>
                <span className="timetable-stub-time">
                  {format(start, 'EEE, h:mm a')} &ndash; {format(end, sameDay ? 'h:mm a' : 'EEE d MMM, h:mm a')}
                </span>
              </span>
            </div>

            {ended ? (
              <span className="timetable-status-past">Ended</span>
            ) : (
              <span className="timetable-status">{relativeDayLabel(start)}</span>
            )}
          </div>

          <div className="timetable-body">
            <span className="timetable-tag">{event.data.category.name}</span>

            <h1 className="timetable-sheet-title">{event.data.title}</h1>

            <div className="timetable-facts">
              <div className="timetable-fact">
                <span className="timetable-fact-label">Mode</span>
                <span className="timetable-fact-value">{event.data.mode}</span>
              </div>
              <div className="timetable-fact">
                <span className="timetable-fact-label">Location</span>
                <span className="timetable-fact-value">{event.data.location}</span>
              </div>
              <div className="timetable-fact">
                <span className="timetable-fact-label">Posted by</span>
                <span className="timetable-fact-value">{event.data.postedBy.name}</span>
              </div>
            </div>

            <p className="timetable-sheet-body">{event.data.excerpt}</p>

            {ended ? (
              <p className="timetable-closed">
                <CalendarX className="size-3.5" />
                {eventMessages.ENDED}
              </p>
            ) : (
              <button
                type="button"
                className="timetable-cta"
                disabled={addToCalendar.isPending}
                onClick={() => addToCalendar.mutate()}
              >
                <CalendarPlus className="size-3.5" />
                {addToCalendar.isPending ? 'Adding…' : 'Add to calendar'}
              </button>
            )}
          </div>
        </article>
      )}
    </div>
  )
}
