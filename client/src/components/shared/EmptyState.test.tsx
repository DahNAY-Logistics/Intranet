import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Megaphone } from 'lucide-react'

import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders the message', () => {
    render(<EmptyState message="No announcements yet." />)

    expect(screen.getByText('No announcements yet.')).toBeInTheDocument()
  })

  it('renders an action passed as children', () => {
    render(
      <EmptyState message="No categories yet." icon={Megaphone}>
        <button type="button">Add a category</button>
      </EmptyState>,
    )

    expect(screen.getByRole('button', { name: 'Add a category' })).toBeInTheDocument()
  })

  it('uses the home tone styling when asked', () => {
    const { container } = render(<EmptyState message="No events yet." tone="home" />)

    expect(container.querySelector('.home-empty-state')).toBeInTheDocument()
    expect(container.querySelector('.empty-state')).not.toBeInTheDocument()
  })

  it('adds the compact modifier only when compact', () => {
    const { container, rerender } = render(<EmptyState message="No users found." />)

    expect(container.querySelector('.empty-state-compact')).not.toBeInTheDocument()

    rerender(<EmptyState message="No users found." compact />)

    expect(container.querySelector('.empty-state-compact')).toBeInTheDocument()
  })
})
