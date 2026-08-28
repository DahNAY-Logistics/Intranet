import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import FeedPagination from './FeedPagination'

describe('FeedPagination', () => {
  it('renders the current page out of the total', () => {
    render(<FeedPagination pagination={{ page: 3, totalPages: 12 }} onPageChange={vi.fn()} />)

    expect(screen.getByText('Page 03 of 12')).toBeInTheDocument()
  })

  it('marks the current page number as current', () => {
    render(<FeedPagination pagination={{ page: 3, totalPages: 12 }} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Go to page 3' })).toHaveAttribute('aria-current', 'page')
  })

  it('moves to the next page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<FeedPagination pagination={{ page: 3, totalPages: 12 }} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('jumps to a page number', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<FeedPagination pagination={{ page: 3, totalPages: 12 }} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: 'Go to page 4' }))

    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('disables both arrows on a single page', () => {
    render(<FeedPagination pagination={{ page: 1, totalPages: 1 }} onPageChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })
})
