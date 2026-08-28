import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { EventResponse } from 'core/types/events'

import EventFeed from './EventFeed'

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

function renderFeed(props: Partial<Parameters<typeof EventFeed>[0]> = {}) {
  return render(
    <MemoryRouter>
      <EventFeed events={mockEvents} {...props} />
    </MemoryRouter>,
  )
}

describe('EventFeed', () => {
  it('renders a card per event', () => {
    renderFeed()

    expect(screen.getByText('Sprint demo')).toBeInTheDocument()
    expect(screen.getByText('Room 4')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderFeed({ events: [] })

    expect(screen.getByText('No events yet.')).toBeInTheDocument()
  })

  it('shows a custom empty message when provided', () => {
    renderFeed({ events: [], emptyMessage: 'Nothing scheduled.' })

    expect(screen.getByText('Nothing scheduled.')).toBeInTheDocument()
  })

  it('renders placeholders and no cards while loading', () => {
    renderFeed({ isLoading: true })

    expect(screen.queryByText('Sprint demo')).not.toBeInTheDocument()
    expect(screen.queryByText('No events yet.')).not.toBeInTheDocument()
  })
})
