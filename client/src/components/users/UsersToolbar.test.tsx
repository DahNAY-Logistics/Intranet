import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useUsersTableStore } from '@/stores/users-table-store'
import type { UsersFilterOptionsResponse } from 'core/types/users'

import UsersToolbar from './UsersToolbar'

const mockFilterOptions: UsersFilterOptionsResponse = {
  roles: [{ value: 'Admin', count: 2 }],
  departments: [{ value: '1', label: 'Engineering', count: 5 }],
  designations: [{ value: '2', label: 'Engineer', count: 4 }],
  locations: [{ value: '3', label: 'Chennai', count: 6 }],
}

function resetStore() {
  const store = useUsersTableStore.getState()
  store.setSearch('')
  store.setRoleFilter([])
  store.setDepartmentFilter([])
  store.setDesignationFilter([])
  store.setLocationFilter([])
}

beforeEach(() => {
  resetStore()
})

describe('UsersToolbar', () => {
  it('renders a filter control per facet plus the search box', () => {
    render(<UsersToolbar filterOptions={mockFilterOptions} />)

    expect(screen.getByRole('button', { name: /Role/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Department/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Designation/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Location/ })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by name, email, or employee ID...')).toBeInTheDocument()
  })

  it('renders without filter options', () => {
    render(<UsersToolbar />)

    expect(screen.getByRole('button', { name: /Role/ })).toBeInTheDocument()
  })

  it('hides the reset button when nothing is filtered', () => {
    render(<UsersToolbar filterOptions={mockFilterOptions} />)

    expect(screen.queryByRole('button', { name: /Reset/ })).not.toBeInTheDocument()
  })

  it('shows the reset button once a filter is applied', () => {
    useUsersTableStore.getState().setRoleFilter(['Admin'])

    render(<UsersToolbar filterOptions={mockFilterOptions} />)

    expect(screen.getByRole('button', { name: /Reset/ })).toBeInTheDocument()
  })

  it('clears every filter and the search when reset is clicked', async () => {
    const user = userEvent.setup()
    const store = useUsersTableStore.getState()
    store.setSearch('ada')
    store.setRoleFilter(['Admin'])
    store.setDepartmentFilter(['1'])

    render(<UsersToolbar filterOptions={mockFilterOptions} />)

    await user.click(screen.getByRole('button', { name: /Reset/ }))

    await waitFor(() => {
      const state = useUsersTableStore.getState()
      expect(state.search).toBe('')
      expect(state.roleFilter).toEqual([])
      expect(state.departmentFilter).toEqual([])
    })
  })
})
