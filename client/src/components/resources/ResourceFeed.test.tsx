import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { ResourceResponse } from 'core/types/resources'

import ResourceFeed from './ResourceFeed'

const mockResources: ResourceResponse[] = [
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
]

function renderFeed(props: Partial<Parameters<typeof ResourceFeed>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ResourceFeed resources={mockResources} {...props} />
    </MemoryRouter>,
  )
}

describe('ResourceFeed', () => {
  it('renders a card per resource', () => {
    renderFeed()

    expect(screen.getByText('Onboarding guide')).toBeInTheDocument()
    expect(screen.getByText('People')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderFeed({ resources: [] })

    expect(screen.getByText('No resources yet.')).toBeInTheDocument()
  })

  it('shows a custom empty message when provided', () => {
    renderFeed({ resources: [], emptyMessage: 'Library is empty.' })

    expect(screen.getByText('Library is empty.')).toBeInTheDocument()
  })

  it('renders placeholders and no cards while loading', () => {
    renderFeed({ isLoading: true })

    expect(screen.queryByText('Onboarding guide')).not.toBeInTheDocument()
    expect(screen.queryByText('No resources yet.')).not.toBeInTheDocument()
  })
})
