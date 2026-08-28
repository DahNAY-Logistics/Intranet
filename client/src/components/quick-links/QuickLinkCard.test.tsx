import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { QuickLinkResponse } from 'core/types/quick-links'

import QuickLinkCard from './QuickLinkCard'

function makeQuickLink(overrides: Partial<QuickLinkResponse> = {}): QuickLinkResponse {
  return {
    id: 42,
    title: 'Employee handbook',
    excerpt: 'Policies, benefits, and everything else you need to know.',
    url: 'https://docs.example.com/handbook',
    status: 'Published',
    category: { id: 1, name: 'HR' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(props: Partial<Parameters<typeof QuickLinkCard>[0]> = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()

  render(<QuickLinkCard quickLink={makeQuickLink()} onEdit={onEdit} onDelete={onDelete} {...props} />)

  return { user, onEdit, onDelete }
}

describe('QuickLinkCard', () => {
  it('renders the quick link fields', () => {
    renderCard()

    expect(screen.getByText('Employee handbook')).toBeInTheDocument()
    expect(screen.getByText('Policies, benefits, and everything else you need to know.')).toBeInTheDocument()
    expect(screen.getByText('HR')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('renders the url as an external link showing the hostname', () => {
    renderCard()

    const link = screen.getByRole('link', { name: 'docs.example.com' })
    expect(link).toHaveAttribute('href', 'https://docs.example.com/handbook')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
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
