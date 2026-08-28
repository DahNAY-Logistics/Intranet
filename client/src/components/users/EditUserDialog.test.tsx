import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { UserListItem } from 'core/types/users'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import EditUserDialog from './EditUserDialog'
import { makeCategoriesResponse, makeUserDetail } from './users-fixtures'

const mockedGet = vi.mocked(api.get)

const listItem: UserListItem = {
  id: '42',
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

function mockLookupsAndDetail(userDetail: ReturnType<typeof makeUserDetail>) {
  mockedGet.mockImplementation(async (url: string) => {
    if (url === '/users/42') return { data: userDetail }
    if (url === '/users/departments') return { data: makeCategoriesResponse() }
    if (url === '/users/designations') return { data: makeCategoriesResponse([{ id: 1, name: 'Software Engineer', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }]) }
    if (url === '/users/locations') return { data: makeCategoriesResponse([{ id: 1, name: 'Bangalore', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }]) }
    if (url === '/users/lookup') return { data: { users: [{ id: 'u2', name: 'Boss Person', employeeId: 'EMP999' }] } }
    throw new Error(`Unexpected GET ${url}`)
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('EditUserDialog', () => {
  it('is closed when user is null', () => {
    renderWithQueryClient(<EditUserDialog user={null} onOpenChange={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a loading state while fetching the user detail', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<EditUserDialog user={listItem} onOpenChange={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
  })

  it('renders the form prefilled once the user detail loads', async () => {
    mockLookupsAndDetail(makeUserDetail({ id: '42', department: { id: 1, name: 'Engineering' } }))

    renderWithQueryClient(<EditUserDialog user={listItem} onOpenChange={vi.fn()} />)

    expect(await screen.findByLabelText('Name')).toHaveValue('Jane Doe')
    expect(await screen.findByLabelText('Department')).toHaveTextContent('Engineering')
    expect(mockedGet).toHaveBeenCalledWith('/users/42', expect.objectContaining({ signal: expect.anything() }))
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Not found' } },
    })

    renderWithQueryClient(<EditUserDialog user={listItem} onOpenChange={vi.fn()} />)

    expect(await screen.findByText('Not found')).toBeInTheDocument()
  })

  it('closes via Cancel', async () => {
    mockLookupsAndDetail(makeUserDetail({ id: '42' }))
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<EditUserDialog user={listItem} onOpenChange={onOpenChange} />)

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })
})
