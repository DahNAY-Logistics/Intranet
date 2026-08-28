import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { BannerResponse } from 'core/types/banners'

import BannerCard from './BannerCard'

function makeBanner(overrides: Partial<BannerResponse> = {}): BannerResponse {
  return {
    id: 42,
    title: 'Office closed',
    excerpt: 'Office closed for the holiday.',
    status: 'Published',
    displayOrder: 1,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-10T00:00:00.000Z',
    category: { id: 1, name: 'General' },
    postedBy: { name: 'Admin' },
    attachment: { id: 1, url: 'http://blob/att-1.jpg' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(props: Partial<Parameters<typeof BannerCard>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <BannerCard banner={makeBanner()} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('BannerCard', () => {
  it('renders the banner fields', () => {
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

  it('shows the display order badge when order is provided', () => {
    renderCard({ order: 3 })

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show a display order badge when order is omitted', () => {
    renderCard()

    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})
