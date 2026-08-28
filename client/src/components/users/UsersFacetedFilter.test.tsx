import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import UsersFacetedFilter from './UsersFacetedFilter'

const options = [
  { value: 'User', label: 'User', count: 8 },
  { value: 'Admin', label: 'Admin', count: 2 },
]

describe('UsersFacetedFilter', () => {
  it('renders the filter title with no selection badge', () => {
    render(<UsersFacetedFilter title="Role" options={options} selectedValues={[]} onChange={vi.fn()} />)

    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.queryByText('selected')).not.toBeInTheDocument()
  })

  it('shows a badge for each selected value', () => {
    render(<UsersFacetedFilter title="Role" options={options} selectedValues={['Admin']} onChange={vi.fn()} />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
