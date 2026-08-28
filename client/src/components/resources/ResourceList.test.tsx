import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { ResourceResponse } from 'core/types/resources'

import ResourceList from './ResourceList'

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

function renderList(props: Partial<Parameters<typeof ResourceList>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <ResourceList resources={mockResources} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('ResourceList', () => {
  it('renders a card per resource', () => {
    renderList()

    expect(screen.getByText('Onboarding guide')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderList({ resources: [] })

    expect(screen.getByText('No resources yet.')).toBeInTheDocument()
  })

  it('renders skeleton rows and no cards while loading', () => {
    renderList({ isLoading: true })

    expect(screen.queryByText('Onboarding guide')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('forwards the resource to onEdit and onDelete', async () => {
    const { user, onEdit, onDelete } = renderList()

    await user.click(screen.getAllByRole('button')[0]!)
    await user.click(screen.getAllByRole('button')[1]!)

    expect(onEdit).toHaveBeenCalledWith(mockResources[0])
    expect(onDelete).toHaveBeenCalledWith(mockResources[0])
  })
})
