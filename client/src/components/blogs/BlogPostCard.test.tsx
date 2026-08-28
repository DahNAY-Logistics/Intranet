import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { BlogPostSummary } from 'core/types/blogs'

import BlogPostCard from './BlogPostCard'

function makePost(overrides: Partial<BlogPostSummary> = {}): BlogPostSummary {
  return {
    id: 'abc',
    slug: 'shipping-fast',
    title: 'Shipping fast',
    excerpt: 'How we cut our release cycle.',
    published_at: '2026-04-02T00:00:00.000Z',
    reading_time: 4,
    ...overrides,
  }
}

function renderCard(post: BlogPostSummary = makePost(), index = 1) {
  return render(
    <MemoryRouter>
      <BlogPostCard post={post} index={index} />
    </MemoryRouter>,
  )
}

describe('BlogPostCard', () => {
  it('renders the title and excerpt', () => {
    renderCard()

    expect(screen.getByText('Shipping fast')).toBeInTheDocument()
    expect(screen.getByText('How we cut our release cycle.')).toBeInTheDocument()
  })

  it('zero-pads the index', () => {
    renderCard(makePost(), 3)

    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('prefers the custom excerpt when present', () => {
    renderCard(makePost({ custom_excerpt: 'A shorter blurb.' }))

    expect(screen.getByText('A shorter blurb.')).toBeInTheDocument()
    expect(screen.queryByText('How we cut our release cycle.')).not.toBeInTheDocument()
  })

  it('links to the post by slug', () => {
    renderCard()

    expect(screen.getByRole('link', { name: 'Shipping fast' })).toHaveAttribute('href', '/blogs/shipping-fast')
  })
})
