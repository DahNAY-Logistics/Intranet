import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useUsersTableStore } from '@/stores/users-table-store'
import type { UserListItem } from 'core/types/users'
import { userStatuses } from 'core/constants'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

import UsersTable from './UsersTable'
import { makeUserDetail, makeUsersResponse } from './users-fixtures'

const mockedGet = vi.mocked(api.get)
const mockedPatch = vi.mocked(api.patch)

beforeEach(() => {
  vi.resetAllMocks()
  useUsersTableStore.setState({
    page: 1,
    pageSize: 10,
    search: '',
    sorting: [],
    statusFilter: userStatuses.active,
    roleFilter: [],
    departmentFilter: [],
    designationFilter: [],
    locationFilter: [],
  })
})

describe('UsersTable', () => {
  it('shows skeleton rows while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<UsersTable />)

    expect(screen.getAllByRole('row')).toHaveLength(6)
  })

  it('renders users once loaded', async () => {
    const users: UserListItem[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        name: 'Jane Doe',
        email: 'jane@dahnay.com',
        role: 'Admin',
        status: 'Active',
        department: { id: 1, name: 'Engineering' },
        designation: { id: 1, name: 'Lead' },
        location: { id: 1, name: 'Bangalore' },
        joinedDate: '2024-01-15T00:00:00.000Z',
      },
      {
        id: '2',
        employeeId: null,
        name: 'John Smith',
        email: 'john@dahnay.com',
        role: 'User',
        status: 'Active',
        department: null,
        designation: null,
        location: { id: 2, name: 'Remote' },
        joinedDate: '2023-06-01T00:00:00.000Z',
      },
    ]
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users, totalCount: 2 }) })

    renderWithQueryClient(<UsersTable />)

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('EMP001')).toBeInTheDocument()
    expect(screen.getByText('jane@dahnay.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Bangalore')).toBeInTheDocument()
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('hides pagination when there are no records', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: [], totalCount: 0 }) })

    renderWithQueryClient(<UsersTable />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument()
  })

  it('falls back to a generic message when the request fails without a server message', async () => {
    mockedGet.mockRejectedValue(new Error('network error'))

    renderWithQueryClient(<UsersTable />)

    expect(await screen.findByText('Failed to load users.')).toBeInTheDocument()
  })

  it('shows the server error message when the request fails with one', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Page must be at least 1' } },
    })

    renderWithQueryClient(<UsersTable />)

    expect(await screen.findByText('Page must be at least 1')).toBeInTheDocument()
  })

  it('fetches the next page from the server when Next is clicked', async () => {
    const page1 = makeUsersResponse({
      users: [
        { id: '1', employeeId: 'EMP001', name: 'User 1', email: 'user1@dahnay.com', role: 'User', status: 'Active', department: null, designation: null, location: null, joinedDate: null },
      ],
      page: 1,
      totalCount: 11,
      totalPages: 2,
    })
    const page2 = makeUsersResponse({
      users: [
        { id: '2', employeeId: 'EMP002', name: 'User 2', email: 'user2@dahnay.com', role: 'User', status: 'Active', department: null, designation: null, location: null, joinedDate: null },
      ],
      page: 2,
      totalCount: 11,
      totalPages: 2,
    })
    mockedGet.mockResolvedValueOnce({ data: page1 }).mockResolvedValueOnce({ data: page2 })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)

    expect(await screen.findByText('User 1')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Go to next page'))

    expect(await screen.findByText('User 2')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenLastCalledWith(
      '/users',
      expect.objectContaining({
        params: expect.objectContaining({ page: 2, pageSize: 10, search: undefined, status: 'Active' }),
      }),
    )
  })

  it('sends a debounced search term to the server and resets to page 1', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse() })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    mockedGet.mockClear()

    await user.type(screen.getByPlaceholderText('Search by name, email, or employee ID...'), 'Jane')

    await waitFor(
      () => {
        expect(mockedGet).toHaveBeenLastCalledWith(
          '/users',
          expect.objectContaining({
            params: expect.objectContaining({ page: 1, pageSize: 10, search: 'Jane' }),
          }),
        )
      },
      { timeout: 1000 },
    )
  })

  it('sends sortBy/sortOrder to the server when the sort column changes and resets to page 1', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse() })

    renderWithQueryClient(<UsersTable />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    mockedGet.mockClear()

    useUsersTableStore.setState({ sorting: [{ id: 'employeeId', desc: true }] })

    await waitFor(() => {
      expect(mockedGet).toHaveBeenLastCalledWith(
        '/users',
        expect.objectContaining({
          params: expect.objectContaining({ page: 1, sortBy: 'employeeId', sortOrder: 'desc' }),
        }),
      )
    })
  })

  it('sends role/department/designation/location filters to the server', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse() })

    renderWithQueryClient(<UsersTable />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    mockedGet.mockClear()

    useUsersTableStore.setState({
      roleFilter: ['Admin'],
      departmentFilter: ['1', '2'],
      designationFilter: ['3'],
      locationFilter: ['4'],
    })

    await waitFor(() => {
      expect(mockedGet).toHaveBeenLastCalledWith(
        '/users',
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            role: 'Admin',
            department: '1,2',
            designation: '3',
            location: '4',
          }),
        }),
      )
    })
  })

  it('sends the status filter to the server and resets to page 1 when the tab changes', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse() })

    renderWithQueryClient(<UsersTable />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    mockedGet.mockClear()

    useUsersTableStore.setState({ statusFilter: userStatuses.inactive })

    await waitFor(() => {
      expect(mockedGet).toHaveBeenLastCalledWith(
        '/users',
        expect.objectContaining({
          params: expect.objectContaining({ page: 1, status: 'Inactive' }),
        }),
      )
    })
  })

  const selectionUsers: UserListItem[] = [
    { id: '1', employeeId: 'EMP001', name: 'Jane Doe', email: 'jane@dahnay.com', role: 'Admin', status: 'Active', department: null, designation: null, location: null, joinedDate: null },
    { id: '2', employeeId: 'EMP002', name: 'John Smith', email: 'john@dahnay.com', role: 'User', status: 'Active', department: null, designation: null, location: null, joinedDate: null },
    { id: '3', employeeId: 'EMP003', name: 'Amy Lee', email: 'amy@dahnay.com', role: 'User', status: 'Active', department: null, designation: null, location: null, joinedDate: null },
  ]

  it('allows selecting Admin rows', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    expect(screen.getByRole('checkbox', { name: 'Select Jane Doe' })).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('shows the bulk actions bar with the selected count when a row is checked', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))

    expect(screen.getByText('1 selected')).toBeInTheDocument()
  })

  it('selects all rows including admins via the header checkbox', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))

    const headerCheckbox = screen.getByRole('checkbox', { name: 'Select all users on this page' })
    expect(headerCheckbox).toHaveAttribute('aria-checked', 'mixed')

    await user.click(headerCheckbox)

    expect(screen.getByRole('checkbox', { name: 'Select John Smith' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: 'Select Amy Lee' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: 'Select Jane Doe' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('3 selected')).toBeInTheDocument()
  })

  it('disables the Deactivate button when an admin row is selected', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select Jane Doe' }))

    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled()
  })

  it('does not open the edit dialog when a checkbox is clicked', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears the selection when a filter changes', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))
    expect(screen.getByText('1 selected')).toBeInTheDocument()

    useUsersTableStore.setState({ roleFilter: ['User'] })

    await waitFor(() => expect(screen.queryByText('1 selected')).not.toBeInTheDocument())
  })

  it('clears the selection when the status tab changes', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))
    expect(screen.getByText('1 selected')).toBeInTheDocument()

    useUsersTableStore.setState({ statusFilter: userStatuses.inactive })

    await waitFor(() => expect(screen.queryByText('1 selected')).not.toBeInTheDocument())
  })

  it('opens the deactivate confirmation dialog with the selected users when Deactivate is clicked', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))
    await user.click(screen.getByRole('button', { name: 'Deactivate' }))

    expect(await screen.findByText('Deactivate 1 user: John Smith?')).toBeInTheDocument()
  })

  it('reactivates the selected users when Reactivate is clicked on the Inactive tab', async () => {
    useUsersTableStore.setState({ statusFilter: userStatuses.inactive })
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    mockedPatch.mockResolvedValue({ data: { message: '1 user reactivated successfully' } })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))
    await user.click(screen.getByRole('button', { name: 'Reactivate' }))

    await waitFor(() => expect(mockedPatch).toHaveBeenCalledWith('/users/reactivate', { ids: ['2'] }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('disables the Edit button when more than one user is selected', async () => {
    mockedGet.mockResolvedValue({ data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select Amy Lee' }))

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('opens the edit dialog with the user detail when Edit is clicked for a single selected user', async () => {
    mockedGet.mockImplementation(async (url: string) => {
      if (url === '/users') return { data: makeUsersResponse({ users: selectionUsers, totalCount: 3 }) }
      if (url === '/users/2') return { data: makeUserDetail({ id: '2', name: 'John Smith', email: 'john@dahnay.com', role: 'User' }) }
      if (url === '/users/departments') return { data: { categories: [] } }
      if (url === '/users/designations') return { data: { categories: [] } }
      if (url === '/users/locations') return { data: { categories: [] } }
      if (url === '/users/lookup') return { data: { users: [] } }
      throw new Error(`Unexpected GET ${url}`)
    })
    const user = userEvent.setup()

    renderWithQueryClient(<UsersTable />)
    await screen.findByText('Jane Doe')

    await user.click(screen.getByRole('checkbox', { name: 'Select John Smith' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledWith('/users/2', expect.objectContaining({ signal: expect.anything() }))
  })
})
