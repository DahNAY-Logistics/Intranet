import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import type { QuickLinkResponse } from 'core/types/quick-links'

import QuickLinkList from './QuickLinkList'

const mockQuickLinks: QuickLinkResponse[] = [
  {
    id: 1,
    title: 'Payroll portal',
    excerpt: 'Payslips and tax documents.',
    url: 'https://payroll.example.com/login',
    status: 'Published',
    category: { id: 1, name: 'HR' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function renderList(props: Partial<Parameters<typeof QuickLinkList>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <QuickLinkList quickLinks={mockQuickLinks} onEdit={onEdit} onDelete={onDelete} {...props} />
    </MemoryRouter>,
  )

  return { user, onEdit, onDelete }
}

describe('QuickLinkList', () => {
  it('renders a card per quick link', () => {
    renderList()

    expect(screen.getByText('Payroll portal')).toBeInTheDocument()
  })

  it('renders the link hostname', () => {
    renderList()

    expect(screen.getByText('payroll.example.com')).toBeInTheDocument()
  })

  it('shows the default empty message when there are none', () => {
    renderList({ quickLinks: [] })

    expect(screen.getByText('No quick links yet.')).toBeInTheDocument()
  })

  it('renders skeleton rows and no cards while loading', () => {
    renderList({ isLoading: true })

    expect(screen.queryByText('Payroll portal')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('forwards the quick link to onEdit and onDelete', async () => {
    const { user, onEdit, onDelete } = renderList()

    await user.click(screen.getAllByRole('button')[0]!)
    await user.click(screen.getAllByRole('button')[1]!)

    expect(onEdit).toHaveBeenCalledWith(mockQuickLinks[0])
    expect(onDelete).toHaveBeenCalledWith(mockQuickLinks[0])
  })
})
