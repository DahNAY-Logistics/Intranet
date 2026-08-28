import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { AnnouncementResponse } from 'core/types/announcements'

import AnnouncementList from './AnnouncementList'

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
]

function renderList(props: Partial<Parameters<typeof AnnouncementList>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <AnnouncementList announcements={mockAnnouncements} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('AnnouncementList', () => {
  it('renders a card per announcement', () => {
    renderList()

    expect(screen.getByText('Holiday notice')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderList({ announcements: [] })

    expect(screen.getByText('No announcements yet.')).toBeInTheDocument()
  })

  it('renders skeleton rows and no cards while loading', () => {
    renderList({ isLoading: true })

    expect(screen.queryByText('Holiday notice')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('forwards the announcement to onEdit', async () => {
    const { user, onEdit } = renderList()

    await user.click(screen.getAllByRole('button')[0]!)

    expect(onEdit).toHaveBeenCalledWith(mockAnnouncements[0])
  })

  it('forwards the announcement to onDelete', async () => {
    const { user, onDelete } = renderList()

    await user.click(screen.getAllByRole('button')[1]!)

    expect(onDelete).toHaveBeenCalledWith(mockAnnouncements[0])
  })
})
