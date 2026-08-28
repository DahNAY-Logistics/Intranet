import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useUsersAdminStore } from '@/stores/users-admin-store'
import type { UserDetail, UsersLookupResponse } from 'core/types/users'
import type { CategoriesResponse } from 'core/types/categories'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect(new Date('2026-02-01T00:00:00.000Z'))}>
      Mock Calendar
    </button>
  ),
}))

import { toast } from 'sonner'

import UserForm from './UserForm'
import { makeCategoriesResponse, makeUserDetail } from './users-fixtures'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedPut = vi.mocked(api.put)

function makeUsersLookupResponse(users: UsersLookupResponse['users'] = [{ id: 'u2', name: 'Boss Person', employeeId: 'EMP999' }]): UsersLookupResponse {
  return { users }
}

function mockLookups(overrides: {
  departments?: CategoriesResponse
  designations?: CategoriesResponse
  locations?: CategoriesResponse
  lookup?: UsersLookupResponse
} = {}) {
  const departments = overrides.departments ?? makeCategoriesResponse([{ id: 1, name: 'Engineering', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }])
  const designations = overrides.designations ?? makeCategoriesResponse([{ id: 1, name: 'Software Engineer', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }])
  const locations = overrides.locations ?? makeCategoriesResponse([{ id: 1, name: 'Bangalore', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }])
  const lookup = overrides.lookup ?? makeUsersLookupResponse()

  mockedGet.mockImplementation(async (url: string) => {
    if (url === '/users/departments') return { data: departments }
    if (url === '/users/designations') return { data: designations }
    if (url === '/users/locations') return { data: locations }
    if (url === '/users/lookup') return { data: lookup }
    throw new Error(`Unexpected GET ${url}`)
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  useUsersAdminStore.setState({ departmentsOpen: false, designationsOpen: false, locationsOpen: false })
})

function renderForm(onSuccess = vi.fn()) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <UserForm onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>,
  )
  return { user, onSuccess }
}

function renderEditForm(userDetail: UserDetail, onSuccess = vi.fn()) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <UserForm user={userDetail} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>,
  )
  return { user, onSuccess }
}

describe('UserForm (create mode)', () => {
  it('renders all fields once lookups load', async () => {
    mockLookups()
    renderForm()

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
    expect(screen.getByLabelText('Employee ID')).toBeInTheDocument()
    expect(await screen.findByLabelText('Department')).toBeInTheDocument()
    expect(screen.getByLabelText('Designation')).toBeInTheDocument()
    expect(screen.getByLabelText('Location')).toBeInTheDocument()
    expect(screen.getByLabelText('Reported To')).toBeInTheDocument()
    expect(screen.getByText('Date of Birth')).toBeInTheDocument()
    expect(screen.getByText('Joined Date')).toBeInTheDocument()
  })

  it('shows an empty-department prompt and opens the departments dialog when no departments exist', async () => {
    mockLookups({ departments: makeCategoriesResponse([]) })
    const { user } = renderForm()

    expect(await screen.findByText('No departments yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create User' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Add a department' }))

    expect(useUsersAdminStore.getState().departmentsOpen).toBe(true)
  })

  it('shows validation errors for the required fields when submitted empty', async () => {
    mockLookups()
    const { user } = renderForm()

    await screen.findByLabelText('Department')
    await user.click(screen.getByRole('button', { name: 'Create User' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Email must be valid')).toBeInTheDocument()
    expect(screen.getByText('Role must be either User or Admin')).toBeInTheDocument()
    expect(screen.getByText('Employee ID is required')).toBeInTheDocument()
    expect(screen.getByText('Department is required')).toBeInTheDocument()
    expect(screen.getByText('Designation is required')).toBeInTheDocument()
    expect(screen.getByText('Location is required')).toBeInTheDocument()
    expect(screen.getByText('Date of birth is required')).toBeInTheDocument()
    expect(screen.getByText('Joined date is required')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('closes the dialog via Cancel without submitting the form', async () => {
    mockLookups()
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <UserForm onSuccess={vi.fn()} />
          </DialogContent>
        </Dialog>
      )
    }
    const user = userEvent.setup()
    renderWithQueryClient(<Harness />)

    await user.type(screen.getByLabelText('Name'), 'Jane Doe')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })
})

describe('UserForm (edit mode)', () => {
  function editedUserDetail(overrides: Partial<UserDetail> = {}): UserDetail {
    return makeUserDetail({
      id: '42',
      name: 'Jane Doe',
      email: 'jane@dahnay.com',
      role: 'User',
      department: { id: 1, name: 'Engineering' },
      designation: { id: 1, name: 'Software Engineer' },
      location: { id: 1, name: 'Bangalore' },
      dob: '2026-01-01T00:00:00.000Z',
      joinedDate: '2026-01-01T00:00:00.000Z',
      reportedTo: { id: 'u2', name: 'Boss Person' },
      ...overrides,
    })
  }

  it('prefills fields from the user prop', async () => {
    mockLookups()
    renderEditForm(editedUserDetail())

    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe')
    expect(screen.getByLabelText('Email')).toHaveValue('jane@dahnay.com')
    expect(await screen.findByLabelText('Department')).toHaveTextContent('Engineering')
    expect(screen.getByLabelText('Designation')).toHaveTextContent('Software Engineer')
    expect(screen.getByLabelText('Location')).toHaveTextContent('Bangalore')
    expect(screen.getByLabelText('Reported To')).toHaveTextContent('Boss Person (EMP999)')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('disables Save until a field changes', async () => {
    mockLookups()
    renderEditForm(editedUserDetail())

    await screen.findByLabelText('Department')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('submits the full form via PUT /users/:id', async () => {
    mockLookups({
      departments: makeCategoriesResponse([
        { id: 1, name: 'Engineering', createdAt: '2026-01-01T00:00:00.000Z', count: 0 },
        { id: 2, name: 'Sales', createdAt: '2026-01-01T00:00:00.000Z', count: 0 },
      ]),
    })
    mockedPut.mockResolvedValue({ data: { message: 'Jane Doe updated successfully' } })
    const { user, onSuccess } = renderEditForm(editedUserDetail())

    await user.click(await screen.findByLabelText('Department'))
    await user.click(await screen.findByRole('option', { name: 'Sales' }))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(mockedPut).toHaveBeenCalled())
    expect(mockedPut).toHaveBeenCalledWith('/users/42', {
      name: 'Jane Doe',
      email: 'jane@dahnay.com',
      role: 'User',
      employeeId: 'EMP001',
      departmentId: 2,
      designationId: 1,
      locationId: 1,
      reportedToId: 'u2',
      dob: new Date('2026-01-01T00:00:00.000Z'),
      joinedDate: new Date('2026-01-01T00:00:00.000Z'),
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Jane Doe updated successfully')
  })

  it('requests the lookup with excludeId set to the user being edited', async () => {
    mockLookups()
    renderEditForm(editedUserDetail())

    await screen.findByLabelText('Reported To')

    expect(mockedGet).toHaveBeenCalledWith('/users/lookup', expect.objectContaining({ params: { excludeId: '42' } }))
  })

  it('shows the server error message inline and does not call onSuccess when the mutation fails', async () => {
    mockLookups({
      departments: makeCategoriesResponse([
        { id: 1, name: 'Engineering', createdAt: '2026-01-01T00:00:00.000Z', count: 0 },
        { id: 2, name: 'Sales', createdAt: '2026-01-01T00:00:00.000Z', count: 0 },
      ]),
    })
    mockedPut.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'A user with this employee ID already exists.' } },
    })
    const { user, onSuccess } = renderEditForm(editedUserDetail())

    await user.click(await screen.findByLabelText('Department'))
    await user.click(await screen.findByRole('option', { name: 'Sales' }))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('A user with this employee ID already exists.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
