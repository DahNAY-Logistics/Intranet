import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { BlogsResponse } from 'core/types/blogs'

import LatestBlogPosts from './LatestBlogPosts'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

const mockResponse: BlogsResponse = {
  posts: [
    { id: 'a', slug: 'first', title: 'First post', excerpt: 'The first one.', published_at: '2026-04-01T00:00:00.000Z' },
  ],
  page: 1,
  pageSize: 3,
  totalCount: 1,
  totalPages: 1,
}

function renderWidget() {
  return renderWithQueryClient(
    <MemoryRouter>
      <LatestBlogPosts />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('LatestBlogPosts', () => {
  it('requests a small page of blog posts', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWidget()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/blogs', expect.objectContaining({ params: { pageSize: expect.any(Number) } })),
    )
  })

  it('renders each post with a numbered link', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWidget()

    expect(await screen.findByText('First post')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /First post/ })).toHaveAttribute('href', '/blogs/first')
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Ghost is unreachable.' } } })

    renderWidget()

    expect(await screen.findByText('Ghost is unreachable.')).toBeInTheDocument()
  })

  it('shows an empty message when there are no posts', async () => {
    mockedGet.mockResolvedValue({ data: { ...mockResponse, posts: [], totalCount: 0 } })

    renderWidget()

    expect(await screen.findByText('No blog posts yet.')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWidget()

    expect(screen.queryByText('No blog posts yet.')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-line').length).toBeGreaterThan(0)
  })
})
