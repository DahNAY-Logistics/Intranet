import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { ResourcesResponse } from 'core/types/resources'

import ResourcesPage from './ResourcesPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function makeResponse(overrides: Partial<ResourcesResponse> = {}): ResourcesResponse {
  return {
    resources: [
      {
        id: 1,
        title: 'Onboarding guide',
        excerpt: 'Everything for your first week.',
        content: '# Welcome',
        url: null,
        status: 'Published',
        category: { id: 1, name: 'People' },
        postedBy: { name: 'Admin' },
        createdAt: '2026-01-01T00:00:00.000Z',
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
      <ResourcesPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('ResourcesPage', () => {
  it('requests the first page of resources', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        '/resources',
        expect.objectContaining({ params: { page: 1, pageSize: 10 } }),
      ),
    )
  })

  it('renders the page heading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Resources' })).toBeInTheDocument()
  })

  it('renders the feed once loaded', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    expect(await screen.findByText('Onboarding guide')).toBeInTheDocument()
  })

  it('shows an empty message when there are no resources', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse({ resources: [], totalCount: 0 }) })

    renderPage()

    expect(await screen.findByText('No resources yet.')).toBeInTheDocument()
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Invalid query parameters' } } })

    renderPage()

    expect(await screen.findByText('Invalid query parameters')).toBeInTheDocument()
  })
})
