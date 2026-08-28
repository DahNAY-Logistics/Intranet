import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useAnnouncementsStore } from '@/stores/announcements-store'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('@/components/announcements', () => ({
  AnnouncementList: () => <div data-testid="announcement-list" />,
  CategoriesDialog: () => <div data-testid="categories-dialog" />,
  CreateDialog: () => <div data-testid="create-dialog" />,
  DeleteDialog: () => <div data-testid="delete-dialog" />,
  EditDialog: () => <div data-testid="edit-dialog" />,
  Filters: () => <div data-testid="filters" />,
}))

import AdminAnnouncementsPage from './AdminAnnouncementsPage'

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  mockedGet.mockResolvedValue({
    data: { announcements: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 1, filterOptions: { statuses: [], categories: [] } },
  })
  useAnnouncementsStore.setState({
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

describe('AdminAnnouncementsPage', () => {
  it('renders a heading, create dialog, categories dialog, and filters', () => {
    renderWithQueryClient(<AdminAnnouncementsPage />)

    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument()
    expect(screen.getByTestId('create-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('categories-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('filters')).toBeInTheDocument()
  })

  it('fetches announcements with default pagination and no filters', async () => {
    renderWithQueryClient(<AdminAnnouncementsPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/announcements', {
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
    useAnnouncementsStore.setState({ statusFilter: ['Published', 'Archived'], categoryFilter: ['cat-1'] })

    renderWithQueryClient(<AdminAnnouncementsPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/announcements', {
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
    renderWithQueryClient(<AdminAnnouncementsPage />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument()
  })

  it('shows pagination when there are records', async () => {
    mockedGet.mockResolvedValue({
      data: { announcements: [], page: 1, pageSize: 10, totalCount: 5, totalPages: 1, filterOptions: { statuses: [], categories: [] } },
    })

    renderWithQueryClient(<AdminAnnouncementsPage />)

    expect(await screen.findByText('Rows per page')).toBeInTheDocument()
  })

  it('opens the categories dialog store state when the Categories button is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminAnnouncementsPage />)

    await user.click(screen.getByRole('button', { name: 'Categories' }))

    expect(useAnnouncementsStore.getState().categoriesOpen).toBe(true)
  })

  it('shows an error message instead of the list when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Failed to load announcements.' } },
    })

    renderWithQueryClient(<AdminAnnouncementsPage />)

    expect(await screen.findByText('Failed to load announcements.')).toBeInTheDocument()
    expect(screen.queryByTestId('announcement-list')).not.toBeInTheDocument()
  })
})
