import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { BlogPostSummary } from 'core/types/blogs'

import BlogFeed from './BlogFeed'

const mockPosts: BlogPostSummary[] = [
  { id: 'a', slug: 'first', title: 'First post', excerpt: 'The first one.', published_at: '2026-04-01T00:00:00.000Z' },
  { id: 'b', slug: 'second', title: 'Second post', excerpt: 'The second one.', published_at: '2026-04-02T00:00:00.000Z' },
  { id: 'c', slug: 'third', title: 'Third post', excerpt: 'The third one.', published_at: '2026-04-03T00:00:00.000Z' },
]

function renderFeed(props: Partial<Parameters<typeof BlogFeed>[0]> = {}) {
  return render(
    <MemoryRouter>
      <BlogFeed posts={mockPosts} {...props} />
    </MemoryRouter>,
  )
}

describe('BlogFeed', () => {
  it('promotes the first post to the lead story', () => {
    renderFeed()

    expect(screen.getByText('Lead story')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'First post' })).toHaveAttribute('href', '/blogs/first')
  })

  it('numbers the remaining posts after the lead', () => {
    renderFeed()

    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.queryByText('01')).not.toBeInTheDocument()
  })

  it('renders every post in the index when the lead is disabled', () => {
    renderFeed({ showLead: false })

    expect(screen.queryByText('Lead story')).not.toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('renders the lead feature image when present', () => {
    renderFeed({ posts: [{ ...mockPosts[0]!, feature_image: 'https://cdn.test/hero.jpg' }] })

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/hero.jpg')
  })

  it('shows the default empty message when there are none', () => {
    renderFeed({ posts: [] })

    expect(screen.getByText('No blog posts yet.')).toBeInTheDocument()
  })

  it('renders placeholders and no posts while loading', () => {
    renderFeed({ isLoading: true })

    expect(screen.queryByText('First post')).not.toBeInTheDocument()
    expect(screen.queryByText('No blog posts yet.')).not.toBeInTheDocument()
  })
})
