import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useUsersTableStore } from '@/stores/users-table-store'

import UsersSearch from './UsersSearch'

beforeEach(() => {
  useUsersTableStore.getState().setSearch('')
})

describe('UsersSearch', () => {
  it('renders an empty search box by default', () => {
    render(<UsersSearch />)

    expect(screen.getByPlaceholderText('Search by name, email, or employee ID...')).toHaveValue('')
  })

  it('reflects what the user types immediately', async () => {
    const user = userEvent.setup()

    render(<UsersSearch />)
    const input = screen.getByPlaceholderText('Search by name, email, or employee ID...')

    await user.type(input, 'ada')

    expect(input).toHaveValue('ada')
  })

  it('pushes the debounced value into the store', async () => {
    const user = userEvent.setup()

    render(<UsersSearch />)

    await user.type(screen.getByPlaceholderText('Search by name, email, or employee ID...'), 'ada')

    await waitFor(() => expect(useUsersTableStore.getState().search).toBe('ada'))
  })

  it('seeds the input from the store value', () => {
    useUsersTableStore.getState().setSearch('grace')

    render(<UsersSearch />)

    expect(screen.getByPlaceholderText('Search by name, email, or employee ID...')).toHaveValue('grace')
  })
})
