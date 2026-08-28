import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import MaintenancePage from './MaintenancePage'

describe('MaintenancePage', () => {
  it('renders the maintenance heading and description', () => {
    render(<MaintenancePage supportEmail="help@dahnay.com" />)

    expect(screen.getByRole('heading', { name: 'Under Maintenance' })).toBeInTheDocument()
    expect(screen.getByText(/We're making some improvements/)).toBeInTheDocument()
  })

  it('renders the support email as a mailto link', () => {
    render(<MaintenancePage supportEmail="help@dahnay.com" />)

    expect(screen.getByRole('link', { name: 'help@dahnay.com' })).toHaveAttribute('href', 'mailto:help@dahnay.com')
  })

  it('omits the support section when no email is configured', () => {
    render(<MaintenancePage supportEmail="" />)

    expect(screen.queryByText(/Need help now/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Under Maintenance' })).toBeInTheDocument()
  })
})
