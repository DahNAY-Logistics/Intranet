import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { AnnouncementResponse } from 'core/types/announcements'

import AnnouncementCard from './AnnouncementCard'

function makeAnnouncement(overrides: Partial<AnnouncementResponse> = {}): AnnouncementResponse {
  return {
    id: 42,
    title: 'Office closed',
    excerpt: 'Office closed for the holiday.',
    status: 'Published',
    category: { id: 1, name: 'General' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(props: Partial<Parameters<typeof AnnouncementCard>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <AnnouncementCard announcement={makeAnnouncement()} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('AnnouncementCard', () => {
  it('renders the announcement fields', () => {
    renderCard()

    expect(screen.getByText('Office closed')).toBeInTheDocument()
    expect(screen.getByText('Office closed for the holiday.')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
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
