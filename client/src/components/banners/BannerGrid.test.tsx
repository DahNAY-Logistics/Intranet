import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { BannerResponse } from 'core/types/banners'

import BannerGrid from './BannerGrid'

const mockBanners: BannerResponse[] = [
  {
    id: 1,
    title: 'Annual day',
    excerpt: 'Join the celebration.',
    status: 'Published',
    displayOrder: 1,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    category: { id: 1, name: 'Culture' },
    postedBy: { name: 'Admin' },
    attachment: { id: 9, url: 'https://cdn.test/banner.jpg' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function renderGrid(props: Partial<Parameters<typeof BannerGrid>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <BannerGrid banners={mockBanners} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('BannerGrid', () => {
  it('renders a card per banner', () => {
    renderGrid()

    expect(screen.getByText('Annual day')).toBeInTheDocument()
    expect(screen.getByText('Join the celebration.')).toBeInTheDocument()
    expect(screen.getByText('Culture')).toBeInTheDocument()
  })

  it('renders the banner image as decorative', () => {
    renderGrid()

    const image = document.querySelector('img')

    expect(image).toHaveAttribute('src', 'https://cdn.test/banner.jpg')
    expect(image).toHaveAttribute('alt', '')
  })

  it('shows the default empty message when there are none', () => {
    renderGrid({ banners: [] })

    expect(screen.getByText('No banners yet.')).toBeInTheDocument()
  })

  it('shows a custom empty message when provided', () => {
    renderGrid({ banners: [], emptyMessage: 'No archived banners.' })

    expect(screen.getByText('No archived banners.')).toBeInTheDocument()
  })

  it('renders skeleton cards and no banners while loading', () => {
    renderGrid({ isLoading: true })

    expect(screen.queryByText('Annual day')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('forwards the banner to onEdit and onDelete', async () => {
    const { user, onEdit, onDelete } = renderGrid()

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0]!)
    await user.click(buttons[1]!)

    expect(onEdit).toHaveBeenCalledWith(mockBanners[0])
    expect(onDelete).toHaveBeenCalledWith(mockBanners[0])
  })
})
