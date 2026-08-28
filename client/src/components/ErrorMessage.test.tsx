import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import ErrorMessage from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the supplied message', () => {
    render(<ErrorMessage message="Name is required" />)

    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('renders nothing visible when no message is supplied', () => {
    const { container } = render(<ErrorMessage />)

    expect(container.textContent).toBe('')
  })
})
