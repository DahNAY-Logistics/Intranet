import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import ErrorAlert from './ErrorAlert'

describe('ErrorAlert', () => {
  it('renders the fallback when no error is supplied', () => {
    render(<ErrorAlert fallback="Failed to load users." />)

    expect(screen.getByText('Failed to load users.')).toBeInTheDocument()
  })

  it('surfaces the server error message from an axios error', () => {
    render(
      <ErrorAlert
        error={{ isAxiosError: true, response: { data: { error: 'Category not found' } } }}
        fallback="Failed to load users."
      />,
    )

    expect(screen.getByText('Category not found')).toBeInTheDocument()
    expect(screen.queryByText('Failed to load users.')).not.toBeInTheDocument()
  })

  it('falls back when the error is not an axios error', () => {
    render(<ErrorAlert error={new Error('boom')} fallback="Failed to load users." />)

    expect(screen.getByText('Failed to load users.')).toBeInTheDocument()
  })

  it('falls back when an axios error carries no error body', () => {
    render(<ErrorAlert error={{ isAxiosError: true, response: { data: {} } }} fallback="Failed to load users." />)

    expect(screen.getByText('Failed to load users.')).toBeInTheDocument()
  })

  it('applies an extra class name to the alert', () => {
    render(<ErrorAlert fallback="Failed to load users." className="mt-6" />)

    expect(screen.getByText('Failed to load users.').closest('.mt-6')).toBeInTheDocument()
  })
})
