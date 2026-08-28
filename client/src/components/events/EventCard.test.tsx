import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { EventResponse } from 'core/types/events'

import EventCard from './EventCard'

function makeEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 42,
    title: 'All-hands kickoff',
    excerpt: 'Quarterly all-hands with leadership updates.',
    status: 'Published',
    mode: 'Hybrid',
    location: 'Main auditorium',
    startDate: '2026-01-01T10:00:00.000Z',
    endDate: '2026-01-01T12:00:00.000Z',
    category: { id: 1, name: 'General' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(props: Partial<Parameters<typeof EventCard>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <EventCard event={makeEvent()} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('EventCard', () => {
  it('renders the event fields', () => {
    renderCard()

    expect(screen.getByText('All-hands kickoff')).toBeInTheDocument()
    expect(screen.getByText('Quarterly all-hands with leadership updates.')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
    expect(screen.getByText('Main auditorium')).toBeInTheDocument()
  })

  it('calls onEdit when the edit button is clicked', async () => {
    const { user, onEdit } = renderCard()

    await user.click(screen.getAllByRole('button')[0]!)

    expect(onEdit).toHaveBeenCalled()
  })

  it('calls onDelete when the delete button is clicked', async () => {
    const { user, onDelete } = renderCard()

    await user.click(screen.getAllByRole('button')[1]!)

    expect(onDelete).toHaveBeenCalled()
  })
})
