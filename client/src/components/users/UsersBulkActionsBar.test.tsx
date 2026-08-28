import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { UserListItem } from 'core/types/users'
import { userStatuses } from 'core/constants'

import UsersBulkActionsBar from './UsersBulkActionsBar'

const jane: UserListItem = {
  id: '1',
  employeeId: 'EMP001',
  name: 'Jane Doe',
  email: 'jane@dahnay.com',
  role: 'User',
  status: 'Active',
  department: null,
  designation: null,
  location: null,
  joinedDate: null,
}

const john: UserListItem = {
  id: '2',
  employeeId: 'EMP002',
  name: 'John Smith',
  email: 'john@dahnay.com',
  role: 'User',
  status: 'Active',
  department: null,
  designation: null,
  location: null,
  joinedDate: null,
}

const admin: UserListItem = {
  id: '3',
  employeeId: 'EMP003',
  name: 'Amy Lee',
  email: 'amy@dahnay.com',
  role: 'Admin',
  status: 'Active',
  department: null,
  designation: null,
  location: null,
  joinedDate: null,
}

describe('UsersBulkActionsBar', () => {
  it('renders the selected count', () => {
    render(
      <UsersBulkActionsBar
        selectedUsers={[jane, john]}
        statusFilter={userStatuses.active}
        onEdit={vi.fn()}
        onStatusAction={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByText('2 selected')).toBeInTheDocument()
  })

  it('disables the Edit button unless exactly one user is selected', () => {
    const { rerender } = render(
      <UsersBulkActionsBar
        selectedUsers={[jane, john]}
        statusFilter={userStatuses.active}
        onEdit={vi.fn()}
        onStatusAction={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()

    rerender(
      <UsersBulkActionsBar
        selectedUsers={[jane]}
        statusFilter={userStatuses.active}
        onEdit={vi.fn()}
        onStatusAction={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
  })

  it('calls onEdit with the selected user when Edit is clicked', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(
      <UsersBulkActionsBar
        selectedUsers={[jane]}
        statusFilter={userStatuses.active}
        onEdit={onEdit}
        onStatusAction={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledWith(jane)
  })

  it('shows Deactivate on the Active tab and calls onStatusAction when clicked', async () => {
    const onStatusAction = vi.fn()
    const user = userEvent.setup()
    render(
      <UsersBulkActionsBar
        selectedUsers={[jane]}
        statusFilter={userStatuses.active}
        onEdit={vi.fn()}
        onStatusAction={onStatusAction}
        onClear={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))

    expect(onStatusAction).toHaveBeenCalled()
  })

  it('shows Reactivate on the Inactive tab and calls onStatusAction when clicked', async () => {
    const onStatusAction = vi.fn()
    const user = userEvent.setup()
    render(
      <UsersBulkActionsBar
        selectedUsers={[jane]}
        statusFilter={userStatuses.inactive}
        onEdit={vi.fn()}
        onStatusAction={onStatusAction}
        onClear={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Reactivate' }))

    expect(onStatusAction).toHaveBeenCalled()
  })

  it('disables Deactivate when an admin is among the selected users', () => {
    render(
      <UsersBulkActionsBar
        selectedUsers={[john, admin]}
        statusFilter={userStatuses.active}
        onEdit={vi.fn()}
        onStatusAction={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled()
  })

  it('keeps Deactivate enabled when no admin is among the selected users', () => {
    render(
      <UsersBulkActionsBar
        selectedUsers={[jane, john]}
        statusFilter={userStatuses.active}
        onEdit={vi.fn()}
        onStatusAction={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeEnabled()
  })

  it('keeps Reactivate enabled even when an admin is among the selected users', () => {
    render(
      <UsersBulkActionsBar
        selectedUsers={[john, admin]}
        statusFilter={userStatuses.inactive}
        onEdit={vi.fn()}
        onStatusAction={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Reactivate' })).toBeEnabled()
  })

  it('calls onClear when Clear selection is clicked', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(
      <UsersBulkActionsBar
        selectedUsers={[jane]}
        statusFilter={userStatuses.active}
        onEdit={vi.fn()}
        onStatusAction={vi.fn()}
        onClear={onClear}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onClear).toHaveBeenCalled()
  })
})
