import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { EventResponse } from 'core/types/events'

import EventDetailPage from './EventDetailPage'

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

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={['/events/8']}>
      <Routes>
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('EventDetailPage', () => {
  it('requests the event by the route id', async () => {
    mockedGet.mockResolvedValue({ data: { event: makeEvent() } })

    renderPage()

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/events/8', expect.anything()))
  })

  it('renders the event once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { event: makeEvent() } })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Sprint demo' })).toBeInTheDocument()
    expect(screen.getByText('End of sprint showcase.')).toBeInTheDocument()
    expect(screen.getByText('Room 4')).toBeInTheDocument()
  })

  it('posts to the calendar endpoint when the add button is clicked', async () => {
    const user = userEvent.setup()
    mockedGet.mockResolvedValue({ data: { event: makeEvent() } })
    mockedPost.mockResolvedValue({ data: { message: 'ok' } })

    renderPage()
    await screen.findByRole('heading', { name: 'Sprint demo' })

    await user.click(screen.getByRole('button', { name: /Add to calendar/ }))

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/events/8/calendar'))
  })

  it('does not offer the calendar button for an event that has ended', async () => {
    mockedGet.mockResolvedValue({
      data: { event: makeEvent({ startDate: '2020-01-01T09:00:00.000Z', endDate: '2020-01-01T10:00:00.000Z' }) },
    })

    renderPage()
    await screen.findByRole('heading', { name: 'Sprint demo' })

    expect(screen.queryByRole('button', { name: /Add to calendar/ })).not.toBeInTheDocument()
  })

  it('always renders a link back to the calendar', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('link', { name: /Back to calendar/ })).toHaveAttribute('href', '/events')
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Event not found' } } })

    renderPage()

    expect(await screen.findByText('Event not found')).toBeInTheDocument()
  })
})
