import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { UserListItem } from 'core/types/users'

vi.mock('@/lib/api', () => ({
  api: { patch: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'

import DeactivateUsersDialog from './DeactivateUsersDialog'

const mockedPatch = vi.mocked(api.patch)

beforeEach(() => {
  vi.resetAllMocks()
})

function makeUser(overrides: Partial<UserListItem> = {}): UserListItem {
  return {
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
    ...overrides,
  }
}

function renderDialog(selectedUsers: UserListItem[], onDeactivated = vi.fn()) {
  const user = userEvent.setup()

  function Harness() {
    const [open, setOpen] = useState(true)
    return (
      <DeactivateUsersDialog
        selectedUsers={selectedUsers}
        open={open}
        onOpenChange={setOpen}
        onDeactivated={onDeactivated}
      />
    )
  }

  renderWithQueryClient(<Harness />)
  return { user, onDeactivated }
}

describe('DeactivateUsersDialog', () => {
  it('shows a singular title for one selected user', () => {
    renderDialog([makeUser({ name: 'Jane Doe' })])

    expect(screen.getByText('Deactivate 1 user: Jane Doe?')).toBeInTheDocument()
  })

  it('lists names for multiple selected users', () => {
    renderDialog([makeUser({ id: '1', name: 'Jane Doe' }), makeUser({ id: '2', name: 'John Smith' })])

    expect(screen.getByText('Deactivate 2 users: Jane Doe, John Smith?')).toBeInTheDocument()
  })

  it('truncates the name list past 5 users', () => {
    const users = Array.from({ length: 7 }, (_, i) => makeUser({ id: String(i), name: `User ${i}` }))
    renderDialog(users)

    expect(screen.getByText('Deactivate 7 users: User 0, User 1, User 2, User 3, User 4, +2 more?')).toBeInTheDocument()
  })

  it('deactivates the selected users, shows a success toast, and closes', async () => {
    mockedPatch.mockResolvedValue({ data: { message: '2 users deactivated successfully' } })
    const { user, onDeactivated } = renderDialog([
      makeUser({ id: '1', name: 'Jane Doe' }),
      makeUser({ id: '2', name: 'John Smith' }),
    ])

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))

    await waitFor(() => expect(mockedPatch).toHaveBeenCalledWith('/users/deactivate', { ids: ['1', '2'] }))
    expect(toast.success).toHaveBeenCalledWith('2 users deactivated successfully')
    expect(onDeactivated).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByText('Deactivate 2 users: Jane Doe, John Smith?')).not.toBeInTheDocument())
  })

  it('closes via Cancel without calling the API', async () => {
    const { user, onDeactivated } = renderDialog([makeUser()])

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockedPatch).not.toHaveBeenCalled()
    expect(onDeactivated).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByText('Deactivate 1 user: Jane Doe?')).not.toBeInTheDocument())
  })

  it('shows the server error message inline and keeps the dialog open on failure', async () => {
    mockedPatch.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Admin users cannot be deactivated: Jane Doe' } },
    })
    const { user, onDeactivated } = renderDialog([makeUser({ name: 'Jane Doe' })])

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))

    expect(await screen.findByText('Admin users cannot be deactivated: Jane Doe')).toBeInTheDocument()
    expect(onDeactivated).not.toHaveBeenCalled()
    expect(screen.getByText('Deactivate 1 user: Jane Doe?')).toBeInTheDocument()
  })

  it('disables Confirm and Cancel while the mutation is pending', async () => {
    mockedPatch.mockReturnValue(new Promise(() => {}))
    const { user } = renderDialog([makeUser()])

    await user.click(screen.getByRole('button', { name: 'Deactivate' }))

    expect(screen.getByRole('button', { name: 'Deactivating…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
