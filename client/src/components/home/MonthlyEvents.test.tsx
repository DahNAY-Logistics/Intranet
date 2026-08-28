import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { EventResponse, EventsActiveResponse } from 'core/types/events'

import MonthlyEvents from './MonthlyEvents'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)

function makeEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 8,
    title: 'Sprint demo',
    excerpt: 'End of sprint showcase.',
    status: 'Published',
    mode: 'Hybrid',
    location: 'Room 4',
    startDate: '2099-05-01T09:00:00.000Z',
    endDate: '2099-05-01T10:00:00.000Z',
    category: { id: 1, name: 'Engineering' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockEvents(events: EventResponse[]): { data: EventsActiveResponse } {
  return { data: { events } }
}

function renderWidget() {
  return renderWithQueryClient(
    <MemoryRouter>
      <MonthlyEvents />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('MonthlyEvents', () => {
  it('requests the active events for the current month in ascending order', async () => {
    mockedGet.mockResolvedValue(mockEvents([]))

    renderWidget()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        '/events/active',
        expect.objectContaining({ params: { month: expect.stringMatching(/^\d{4}-\d{2}$/), sortOrder: 'asc' } }),
      ),
    )
  })

  it('renders each event with its mode, location and detail link', async () => {
    mockedGet.mockResolvedValue(mockEvents([makeEvent()]))

    renderWidget()

    expect(await screen.findByText('Sprint demo')).toBeInTheDocument()
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
    expect(screen.getByText('Room 4')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sprint demo' })).toHaveAttribute('href', '/events/8')
  })

  it('posts to the calendar endpoint when the add button is clicked', async () => {
    const user = userEvent.setup()
    mockedGet.mockResolvedValue(mockEvents([makeEvent()]))
    mockedPost.mockResolvedValue({ data: { message: 'ok' } })

    renderWidget()
    await screen.findByText('Sprint demo')

    await user.click(screen.getByRole('button'))

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/events/8/calendar'))
  })

  it('marks a past event as ended instead of offering the calendar button', async () => {
    mockedGet.mockResolvedValue(
      mockEvents([makeEvent({ startDate: '2020-01-01T09:00:00.000Z', endDate: '2020-01-01T10:00:00.000Z' })]),
    )

    renderWidget()

    expect(await screen.findByText('Ended')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows an empty message when there are none this month', async () => {
    mockedGet.mockResolvedValue(mockEvents([]))

    renderWidget()

    expect(await screen.findByText('No events this month.')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWidget()

    expect(screen.queryByText('No events this month.')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-line').length).toBeGreaterThan(0)
  })
})
