import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useUsersTableStore } from '@/stores/users-table-store'
import { userStatuses } from 'core/constants'

vi.mock('@/components/users', () => ({
  UsersTable: () => <div data-testid="users-table" />,
  CreateUserDialog: () => <div data-testid="create-user-dialog" />,
  DepartmentsDialog: () => <div data-testid="departments-dialog" />,
  DesignationsDialog: () => <div data-testid="designations-dialog" />,
  LocationsDialog: () => <div data-testid="locations-dialog" />,
}))

import AdminUsersPage from './AdminUsersPage'

beforeEach(() => {
  useUsersTableStore.setState({ statusFilter: userStatuses.active })
})

describe('AdminUsersPage', () => {
  it('renders a heading and the users table', () => {
    render(<AdminUsersPage />)

    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByTestId('users-table')).toBeInTheDocument()
  })

  it('renders the lookup manager buttons and dialogs', () => {
    render(<AdminUsersPage />)

    expect(screen.getByRole('button', { name: 'Departments' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Designations' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Locations' })).toBeInTheDocument()
    expect(screen.getByTestId('departments-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('designations-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('locations-dialog')).toBeInTheDocument()
  })

  it('shows the Active tab as selected by default', () => {
    render(<AdminUsersPage />)

    expect(screen.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to the Inactive tab when clicked', async () => {
    const user = userEvent.setup()
    render(<AdminUsersPage />)

    await user.click(screen.getByRole('tab', { name: 'Inactive' }))

    expect(useUsersTableStore.getState().statusFilter).toBe('Inactive')
  })
})
