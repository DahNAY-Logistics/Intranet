import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useDirectoryStore } from '@/stores/directory-store'
import type { DirectoryFilterOptionsResponse } from 'core/types/directory'

import Filters from './Filters'

const mockFilterOptions: DirectoryFilterOptionsResponse = {
  departments: [{ value: '1', label: 'Engineering', count: 5 }],
  designations: [{ value: '2', label: 'Engineer', count: 4 }],
  locations: [{ value: '3', label: 'Chennai', count: 6 }],
}

beforeEach(() => {
  useDirectoryStore.getState().resetFilters()
})

describe('Directory Filters', () => {
  it('renders a control per facet', () => {
    render(<Filters filterOptions={mockFilterOptions} />)

    expect(screen.getByRole('button', { name: /Department/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Designation/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Location/ })).toBeInTheDocument()
  })

  it('renders without filter options', () => {
    render(<Filters />)

    expect(screen.getByRole('button', { name: /Department/ })).toBeInTheDocument()
  })

  it('hides the reset button when nothing is filtered', () => {
    render(<Filters filterOptions={mockFilterOptions} />)

    expect(screen.queryByRole('button', { name: /Reset/ })).not.toBeInTheDocument()
  })

  it('shows the reset button once a facet is selected', () => {
    useDirectoryStore.getState().setDepartmentFilter(['1'])

    render(<Filters filterOptions={mockFilterOptions} />)

    expect(screen.getByRole('button', { name: /Reset/ })).toBeInTheDocument()
  })

  it('clears every facet when reset is clicked', async () => {
    const user = userEvent.setup()
    const store = useDirectoryStore.getState()
    store.setDepartmentFilter(['1'])
    store.setDesignationFilter(['2'])
    store.setLocationFilter(['3'])

    render(<Filters filterOptions={mockFilterOptions} />)

    await user.click(screen.getByRole('button', { name: /Reset/ }))

    await waitFor(() => {
      const state = useDirectoryStore.getState()
      expect(state.departmentFilter).toEqual([])
      expect(state.designationFilter).toEqual([])
      expect(state.locationFilter).toEqual([])
    })
  })
})
