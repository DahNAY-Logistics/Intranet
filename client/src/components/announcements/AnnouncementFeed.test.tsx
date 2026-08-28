import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { AnnouncementResponse } from 'core/types/announcements'

import AnnouncementFeed from './AnnouncementFeed'

const mockAnnouncements: AnnouncementResponse[] = [
  {
    id: 1,
    title: 'Holiday notice',
    excerpt: 'Office closed Friday.',
    status: 'Published',
    category: { id: 1, name: 'General' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'New coffee machine',
    excerpt: 'Now on the third floor.',
    status: 'Published',
    category: { id: 2, name: 'Office' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-06T00:00:00.000Z',
  },
]

function renderFeed(props: Partial<Parameters<typeof AnnouncementFeed>[0]> = {}) {
  return render(
    <MemoryRouter>
      <AnnouncementFeed announcements={mockAnnouncements} {...props} />
    </MemoryRouter>,
  )
}

describe('AnnouncementFeed', () => {
  it('renders a card per announcement', () => {
    renderFeed()

    expect(screen.getByText('Holiday notice')).toBeInTheDocument()
    expect(screen.getByText('New coffee machine')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderFeed({ announcements: [] })

    expect(screen.getByText('No announcements yet.')).toBeInTheDocument()
  })

  it('shows a custom empty message when provided', () => {
    renderFeed({ announcements: [], emptyMessage: 'Nothing this month.' })

    expect(screen.getByText('Nothing this month.')).toBeInTheDocument()
  })

  it('renders placeholders and no cards while loading', () => {
    renderFeed({ isLoading: true })

    expect(screen.queryByText('Holiday notice')).not.toBeInTheDocument()
    expect(screen.queryByText('No announcements yet.')).not.toBeInTheDocument()
  })
})
