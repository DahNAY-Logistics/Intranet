import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import DirectoryFacetedFilter from './DirectoryFacetedFilter'

const options = [
  { value: '1', label: 'Engineering', count: 5 },
  { value: '2', label: 'Design', count: 3 },
]

describe('DirectoryFacetedFilter', () => {
  it('renders the facet title with no selection chip', () => {
    render(<DirectoryFacetedFilter title="Department" options={options} selectedValues={[]} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Department/ })).toBeInTheDocument()
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument()
  })

  it('shows a chip for each selected value', () => {
    render(<DirectoryFacetedFilter title="Department" options={options} selectedValues={['1']} onChange={vi.fn()} />)

    expect(screen.getByText('Engineering')).toBeInTheDocument()
  })
})
