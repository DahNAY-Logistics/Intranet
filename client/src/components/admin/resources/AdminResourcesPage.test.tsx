import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useResourcesStore } from '@/stores/resources-store'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('@/components/resources', () => ({
  ResourceList: () => <div data-testid="resource-list" />,
  CategoriesDialog: () => <div data-testid="categories-dialog" />,
  CreateDialog: () => <div data-testid="create-dialog" />,
  DeleteDialog: () => <div data-testid="delete-dialog" />,
  EditDialog: () => <div data-testid="edit-dialog" />,
  Filters: () => <div data-testid="filters" />,
}))

import AdminResourcesPage from './AdminResourcesPage'

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  mockedGet.mockResolvedValue({
    data: { resources: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 1, filterOptions: { statuses: [], categories: [] } },
  })
  useResourcesStore.setState({
    page: 1,
    pageSize: 10,
    statusFilter: [],
    categoryFilter: [],
    sortOrder: 'desc',
    editingId: null,
    deleting: null,
    categoriesOpen: false,
  })
})

describe('AdminResourcesPage', () => {
  it('renders a heading, create dialog, categories dialog, and filters', () => {
    renderWithQueryClient(<AdminResourcesPage />)

    expect(screen.getByRole('heading', { name: 'Resources' })).toBeInTheDocument()
    expect(screen.getByTestId('create-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('categories-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('filters')).toBeInTheDocument()
  })

  it('fetches resources with default pagination and no filters', async () => {
    renderWithQueryClient(<AdminResourcesPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/resources', {
        signal: expect.anything(),
        params: {
          page: 1,
          pageSize: 10,
          status: undefined,
          categoryId: undefined,
          sortOrder: 'desc',
        },
      }),
    )
  })

  it('sends comma-joined status and category filters', async () => {
    useResourcesStore.setState({ statusFilter: ['Published', 'Archived'], categoryFilter: ['cat-1'] })

    renderWithQueryClient(<AdminResourcesPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/resources', {
        signal: expect.anything(),
        params: {
          page: 1,
          pageSize: 10,
          status: 'Published,Archived',
          categoryId: 'cat-1',
          sortOrder: 'desc',
        },
      }),
    )
  })

  it('hides pagination when there are no records', async () => {
    renderWithQueryClient(<AdminResourcesPage />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument()
  })

  it('shows pagination when there are records', async () => {
    mockedGet.mockResolvedValue({
      data: { resources: [], page: 1, pageSize: 10, totalCount: 5, totalPages: 1, filterOptions: { statuses: [], categories: [] } },
    })

    renderWithQueryClient(<AdminResourcesPage />)

    expect(await screen.findByText('Rows per page')).toBeInTheDocument()
  })

  it('opens the categories dialog store state when the Categories button is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminResourcesPage />)

    await user.click(screen.getByRole('button', { name: 'Categories' }))

    expect(useResourcesStore.getState().categoriesOpen).toBe(true)
  })

  it('shows an error message instead of the list when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Failed to load resources.' } },
    })

    renderWithQueryClient(<AdminResourcesPage />)

    expect(await screen.findByText('Failed to load resources.')).toBeInTheDocument()
    expect(screen.queryByTestId('resource-list')).not.toBeInTheDocument()
  })
})
