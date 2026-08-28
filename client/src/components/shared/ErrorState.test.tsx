import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import ErrorState from './ErrorState'

describe('ErrorState', () => {
  it('surfaces the server error message', () => {
    render(
      <ErrorState
        error={{ isAxiosError: true, response: { data: { error: 'Invalid query parameters' } } }}
        fallback="Failed to load announcements."
      />,
    )

    expect(screen.getByText('Invalid query parameters')).toBeInTheDocument()
  })

  it('falls back when the error carries no server message', () => {
    render(<ErrorState error={new Error('network')} fallback="Failed to load announcements." />)

    expect(screen.getByText('Failed to load announcements.')).toBeInTheDocument()
  })

  it('exposes the message as an alert', () => {
    render(<ErrorState fallback="Failed to load events." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load events.')
  })

  it('uses the home tone styling when asked', () => {
    const { container } = render(<ErrorState fallback="Failed to load events." tone="home" />)

    expect(container.querySelector('.home-empty-state')).toBeInTheDocument()
  })
})
