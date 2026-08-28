import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useQuickLinksStore } from '@/stores/quick-links-store'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('@/components/quick-links', () => ({
  QuickLinkList: () => <div data-testid="quick-link-list" />,
  CategoriesDialog: () => <div data-testid="categories-dialog" />,
  CreateDialog: () => <div data-testid="create-dialog" />,
  DeleteDialog: () => <div data-testid="delete-dialog" />,
  EditDialog: () => <div data-testid="edit-dialog" />,
  Filters: () => <div data-testid="filters" />,
}))

import AdminQuickLinksPage from './AdminQuickLinksPage'

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  mockedGet.mockResolvedValue({
    data: { quickLinks: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 1, filterOptions: { statuses: [], categories: [] } },
  })
  useQuickLinksStore.setState({
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

describe('AdminQuickLinksPage', () => {
  it('renders a heading, create dialog, categories dialog, and filters', () => {
    renderWithQueryClient(<AdminQuickLinksPage />)

    expect(screen.getByRole('heading', { name: 'Quick Links' })).toBeInTheDocument()
    expect(screen.getByTestId('create-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('categories-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('filters')).toBeInTheDocument()
  })

  it('fetches quick links with default pagination and no filters', async () => {
    renderWithQueryClient(<AdminQuickLinksPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/quick-links', {
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
    useQuickLinksStore.setState({ statusFilter: ['Published', 'Archived'], categoryFilter: ['cat-1'] })

    renderWithQueryClient(<AdminQuickLinksPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/quick-links', {
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
    renderWithQueryClient(<AdminQuickLinksPage />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument()
  })

  it('shows pagination when there are records', async () => {
    mockedGet.mockResolvedValue({
      data: { quickLinks: [], page: 1, pageSize: 10, totalCount: 5, totalPages: 1, filterOptions: { statuses: [], categories: [] } },
    })

    renderWithQueryClient(<AdminQuickLinksPage />)

    expect(await screen.findByText('Rows per page')).toBeInTheDocument()
  })

  it('opens the categories dialog store state when the Categories button is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminQuickLinksPage />)

    await user.click(screen.getByRole('button', { name: 'Categories' }))

    expect(useQuickLinksStore.getState().categoriesOpen).toBe(true)
  })

  it('shows an error message instead of the list when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Failed to load quick links.' } },
    })

    renderWithQueryClient(<AdminQuickLinksPage />)

    expect(await screen.findByText('Failed to load quick links.')).toBeInTheDocument()
    expect(screen.queryByTestId('quick-link-list')).not.toBeInTheDocument()
  })
})
