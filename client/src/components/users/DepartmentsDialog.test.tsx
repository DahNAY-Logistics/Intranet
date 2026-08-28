import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useUsersAdminStore } from '@/stores/users-admin-store'
import type { CategoriesResponse, CategoryListItem } from 'core/types/categories'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'

import DepartmentsDialog from './DepartmentsDialog'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedDelete = vi.mocked(api.delete)

function makeDepartment(overrides: Partial<CategoryListItem> = {}): CategoryListItem {
  return { id: 1, name: 'Engineering', createdAt: '2026-01-01T00:00:00.000Z', count: 0, ...overrides }
}

function makeDepartmentsResponse(categories: CategoryListItem[]): CategoriesResponse {
  return { categories }
}

beforeEach(() => {
  vi.resetAllMocks()
  useUsersAdminStore.setState({ departmentsOpen: true })
})

describe('DepartmentsDialog', () => {
  it('renders the department list', async () => {
    mockedGet.mockResolvedValue({ data: makeDepartmentsResponse([makeDepartment({ name: 'Engineering' })]) })

    renderWithQueryClient(<DepartmentsDialog />)

    expect(await screen.findByText('Engineering')).toBeInTheDocument()
  })

  it('shows an empty state with no departments', async () => {
    mockedGet.mockResolvedValue({ data: makeDepartmentsResponse([]) })

    renderWithQueryClient(<DepartmentsDialog />)

    expect(await screen.findByText('No departments yet.')).toBeInTheDocument()
  })

  it('creates a department and shows a success toast', async () => {
    mockedGet.mockResolvedValue({ data: makeDepartmentsResponse([]) })
    mockedPost.mockResolvedValue({ data: makeDepartment({ id: 2, name: 'Sales' }) })
    const user = userEvent.setup()
    renderWithQueryClient(<DepartmentsDialog />)

    await screen.findByText('No departments yet.')
    await user.type(screen.getByPlaceholderText('New department name'), 'Sales')
    await user.click(screen.getByRole('button', { name: '' }))

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/users/departments', { name: 'Sales' }))
    expect(toast.success).toHaveBeenCalledWith('Department "Sales" created')
  })

  it('shows the usage count and disables delete when a department is in use', async () => {
    mockedGet.mockResolvedValue({ data: makeDepartmentsResponse([makeDepartment({ id: 1, name: 'Engineering', count: 3 })]) })

    renderWithQueryClient(<DepartmentsDialog />)

    expect(await screen.findByText('(3)')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash2')),
    ).toBeDisabled()
  })

  it('enables delete for an unused department and deletes it after confirmation', async () => {
    mockedGet.mockResolvedValue({ data: makeDepartmentsResponse([makeDepartment({ id: 1, name: 'Engineering', count: 0 })]) })
    mockedDelete.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    renderWithQueryClient(<DepartmentsDialog />)

    await screen.findByText('Engineering')
    const deleteButton = screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash2'))!
    expect(deleteButton).toBeEnabled()
    await user.click(deleteButton)

    expect(await screen.findByText('Delete department "Engineering"?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('/users/departments/1'))
    expect(toast.success).toHaveBeenCalledWith('Department "Engineering" deleted')
  })

  it('shows the server error when a department is still in use', async () => {
    mockedGet.mockResolvedValue({ data: makeDepartmentsResponse([makeDepartment({ id: 1, name: 'Engineering', count: 0 })]) })
    mockedDelete.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Cannot delete department: 2 users still use it.' } },
    })
    const user = userEvent.setup()
    renderWithQueryClient(<DepartmentsDialog />)

    await screen.findByText('Engineering')
    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash2'))!)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Cannot delete department: 2 users still use it.')).toBeInTheDocument()
  })
})
