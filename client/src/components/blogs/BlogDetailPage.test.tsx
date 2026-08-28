import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { BlogPostDetail } from 'core/types/blogs'

import BlogDetailPage from './BlogDetailPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function makePost(overrides: Partial<BlogPostDetail> = {}): BlogPostDetail {
  return {
    id: 'a',
    slug: 'shipping-fast',
    title: 'Shipping fast',
    excerpt: 'How we cut our release cycle.',
    published_at: '2026-04-02T00:00:00.000Z',
    reading_time: 4,
    content: 'We ship every day.',
    ...overrides,
  }
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={['/blogs/shipping-fast']}>
      <Routes>
        <Route path="/blogs/:slug" element={<BlogDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('BlogDetailPage', () => {
  it('requests the post by the route slug', async () => {
    mockedGet.mockResolvedValue({ data: { post: makePost() } })

    renderPage()

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/blogs/shipping-fast', expect.anything()))
  })

  it('renders the post title and body once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { post: makePost() } })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Shipping fast' })).toBeInTheDocument()
    expect(screen.getByText('We ship every day.')).toBeInTheDocument()
  })

  it('renders the feature image when the post has one', async () => {
    mockedGet.mockResolvedValue({ data: { post: makePost({ feature_image: 'https://cdn.test/hero.jpg' }) } })

    renderPage()

    expect(await screen.findByAltText('Shipping fast')).toHaveAttribute('src', 'https://cdn.test/hero.jpg')
  })

  it('omits the figure when the post has no feature image', async () => {
    mockedGet.mockResolvedValue({ data: { post: makePost() } })

    renderPage()

    await screen.findByRole('heading', { name: 'Shipping fast' })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('always renders a link back to the dispatch', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('link', { name: /Back to dispatch/ })).toHaveAttribute('href', '/blogs')
  })

  it('surfaces the server error message when the post is missing', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Blog post not found' } } })

    renderPage()

    expect(await screen.findByText('Blog post not found')).toBeInTheDocument()
  })
})
