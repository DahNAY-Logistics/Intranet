import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import type { AnnouncementResponse } from 'core/types/announcements'

import AnnouncementFeedCard from './AnnouncementFeedCard'

const mockAnnouncement: AnnouncementResponse = {
  id: 7,
  title: 'Quarterly townhall',
  excerpt: 'Join us in the main hall at 4pm.',
  status: 'Published',
  category: { id: 2, name: 'Company' },
  postedBy: { name: 'Priya' },
  createdAt: '2026-03-09T00:00:00.000Z',
}

function renderCard(announcement: AnnouncementResponse = mockAnnouncement) {
  return render(
    <MemoryRouter>
      <AnnouncementFeedCard announcement={announcement} />
    </MemoryRouter>,
  )
}

describe('AnnouncementFeedCard', () => {
  it('renders the title, excerpt and category', () => {
    renderCard()

    expect(screen.getByText('Quarterly townhall')).toBeInTheDocument()
    expect(screen.getByText('Join us in the main hall at 4pm.')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
  })

  it('splits the posted date into month and day', () => {
    renderCard()

    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('09')).toBeInTheDocument()
  })

  it('shows the author and year in the byline', () => {
    renderCard()

    expect(screen.getByText(/Priya/)).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('links to the announcement detail route', () => {
    renderCard()

    expect(screen.getByRole('link', { name: 'Quarterly townhall' })).toHaveAttribute('href', '/announcements/7')
  })
})
