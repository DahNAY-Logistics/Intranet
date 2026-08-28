import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { EventsResponse } from 'core/types/events'

import EventsPage from './EventsPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function makeResponse(overrides: Partial<EventsResponse> = {}): EventsResponse {
  return {
    events: [
      {
        id: 1,
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
      },
    ],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    filterOptions: { categories: [], modes: [] },
    ...overrides,
  }
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('EventsPage', () => {
  it('requests events sorted newest first', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        '/events',
        expect.objectContaining({ params: expect.objectContaining({ sortOrder: 'desc' }) }),
      ),
    )
  })

  it('renders the page heading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument()
  })

  it('renders the feed once loaded', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    expect(await screen.findByText('Sprint demo')).toBeInTheDocument()
  })

  it('shows an empty message when there are no events', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse({ events: [], totalCount: 0 }) })

    renderPage()

    expect(await screen.findByText('No events yet.')).toBeInTheDocument()
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Invalid query parameters' } } })

    renderPage()

    expect(await screen.findByText('Invalid query parameters')).toBeInTheDocument()
  })
})
