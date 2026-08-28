import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { ResourceResponse } from 'core/types/resources'

import ResourceFeedCard from './ResourceFeedCard'

function makeResource(overrides: Partial<ResourceResponse> = {}): ResourceResponse {
  return {
    id: 5,
    title: 'Expense policy',
    excerpt: 'How to file a reimbursement.',
    content: '# Expense policy',
    url: null,
    status: 'Published',
    category: { id: 1, name: 'Finance' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-02-14T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(resource: ResourceResponse = makeResource()) {
  return render(
    <MemoryRouter>
      <ResourceFeedCard resource={resource} />
    </MemoryRouter>,
  )
}

describe('ResourceFeedCard', () => {
  it('renders the title, excerpt, category and date', () => {
    renderCard()

    expect(screen.getByText('Expense policy')).toBeInTheDocument()
    expect(screen.getByText('How to file a reimbursement.')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('14 Feb 2026')).toBeInTheDocument()
  })

  it('links to the resource detail route', () => {
    renderCard()

    expect(screen.getByRole('link', { name: 'Expense policy' })).toHaveAttribute('href', '/resources/5')
  })
})
