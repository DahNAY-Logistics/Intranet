import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { EventResponse } from 'core/types/events'

import EventList from './EventList'

const mockEvents: EventResponse[] = [
  {
    id: 1,
    title: 'Sprint demo',
    excerpt: 'End of sprint showcase.',
    status: 'Published',
    mode: 'Hybrid',
    location: 'Room 4',
    startDate: '2099-05-01T09:00:00.000Z',
    endDate: '2099-05-01T10:00:00.000Z',
    category: { id: 1, name: 'Engineering' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function renderList(props: Partial<Parameters<typeof EventList>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <EventList events={mockEvents} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('EventList', () => {
  it('renders a card per event', () => {
    renderList()

    expect(screen.getByText('Sprint demo')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderList({ events: [] })

    expect(screen.getByText('No events yet.')).toBeInTheDocument()
  })

  it('renders skeleton rows and no cards while loading', () => {
    renderList({ isLoading: true })

    expect(screen.queryByText('Sprint demo')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('forwards the event to onEdit and onDelete', async () => {
    const { user, onEdit, onDelete } = renderList()

    await user.click(screen.getAllByRole('button')[0]!)
    await user.click(screen.getAllByRole('button')[1]!)

    expect(onEdit).toHaveBeenCalledWith(mockEvents[0])
    expect(onDelete).toHaveBeenCalledWith(mockEvents[0])
  })
})
