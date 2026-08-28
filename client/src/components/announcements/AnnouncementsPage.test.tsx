import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { AnnouncementsResponse } from 'core/types/announcements'

import AnnouncementsPage from './AnnouncementsPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function makeResponse(overrides: Partial<AnnouncementsResponse> = {}): AnnouncementsResponse {
  return {
    announcements: [
      {
        id: 1,
        title: 'Holiday notice',
        excerpt: 'Office closed Friday.',
        status: 'Published',
        category: { id: 1, name: 'General' },
        postedBy: { name: 'Admin' },
        createdAt: '2026-01-05T00:00:00.000Z',
      },
    ],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    filterOptions: { categories: [] },
    ...overrides,
  }
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter>
      <AnnouncementsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AnnouncementsPage', () => {
  it('requests the first page of announcements', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        '/announcements',
        expect.objectContaining({ params: { page: 1, pageSize: 10 } }),
      ),
    )
  })

  it('renders the page heading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument()
  })

  it('renders the feed once loaded', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    expect(await screen.findByText('Holiday notice')).toBeInTheDocument()
  })

  it('hides pagination when there are no announcements', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse({ announcements: [], totalCount: 0 }) })

    renderPage()

    expect(await screen.findByText('No announcements yet.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Invalid query parameters' } } })

    renderPage()

    expect(await screen.findByText('Invalid query parameters')).toBeInTheDocument()
  })
})
