import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { EventResponse } from 'core/types/events'

import EventFeedCard from './EventFeedCard'

function makeEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 12,
    title: 'Design review',
    excerpt: 'Walkthrough of the new dashboard.',
    status: 'Published',
    mode: 'Online',
    location: 'Zoom',
    startDate: '2099-06-01T09:00:00.000Z',
    endDate: '2099-06-01T10:00:00.000Z',
    category: { id: 3, name: 'Engineering' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(event: EventResponse = makeEvent()) {
  return render(
    <MemoryRouter>
      <EventFeedCard event={event} />
    </MemoryRouter>,
  )
}

describe('EventFeedCard', () => {
  it('renders the title, excerpt, category, mode and location', () => {
    renderCard()

    expect(screen.getByText('Design review')).toBeInTheDocument()
    expect(screen.getByText('Walkthrough of the new dashboard.')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('Zoom')).toBeInTheDocument()
  })

  it('links to the event detail route', () => {
    renderCard()

    expect(screen.getByRole('link', { name: 'Design review' })).toHaveAttribute('href', '/events/12')
  })

  it('marks a past event as ended', () => {
    renderCard(makeEvent({ startDate: '2020-01-01T09:00:00.000Z', endDate: '2020-01-01T10:00:00.000Z' }))

    expect(screen.getByText('Ended')).toBeInTheDocument()
  })

  it('does not mark a future event as ended', () => {
    renderCard()

    expect(screen.queryByText('Ended')).not.toBeInTheDocument()
  })
})
