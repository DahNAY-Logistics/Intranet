import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { BlogsResponse } from 'core/types/blogs'

import BlogsPage from './BlogsPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function makeResponse(overrides: Partial<BlogsResponse> = {}): BlogsResponse {
  return {
    posts: [
      { id: 'a', slug: 'first', title: 'First post', excerpt: 'The first one.', published_at: '2026-04-01T00:00:00.000Z' },
    ],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    ...overrides,
  }
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter>
      <BlogsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('BlogsPage', () => {
  it('requests the first page of posts', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/blogs', expect.objectContaining({ params: { page: 1, pageSize: 10 } })),
    )
  })

  it('renders the page heading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Blogs' })).toBeInTheDocument()
  })

  it('shows a lead story on the first page', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    expect(await screen.findByText('Lead story')).toBeInTheDocument()
  })

  it('shows an empty message when there are no posts', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse({ posts: [], totalCount: 0 }) })

    renderPage()

    expect(await screen.findByText('No blog posts yet.')).toBeInTheDocument()
  })

  it('surfaces the server error message when the upstream is unavailable', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Could not reach the blog service. Please try again later.' } },
    })

    renderPage()

    expect(await screen.findByText('Could not reach the blog service. Please try again later.')).toBeInTheDocument()
  })
})
