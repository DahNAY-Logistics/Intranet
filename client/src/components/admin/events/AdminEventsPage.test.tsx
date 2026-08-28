import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useEventsStore } from '@/stores/events-store'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('@/components/events', () => ({
  EventList: () => <div data-testid="event-list" />,
  CategoriesDialog: () => <div data-testid="categories-dialog" />,
  CreateDialog: () => <div data-testid="create-dialog" />,
  DeleteDialog: () => <div data-testid="delete-dialog" />,
  EditDialog: () => <div data-testid="edit-dialog" />,
  Filters: () => <div data-testid="filters" />,
}))

import AdminEventsPage from './AdminEventsPage'

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  mockedGet.mockResolvedValue({
    data: { events: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 1, filterOptions: { statuses: [], categories: [], modes: [] } },
  })
  useEventsStore.setState({
    page: 1,
    pageSize: 10,
    statusFilter: [],
    categoryFilter: [],
    modeFilter: [],
    sortOrder: 'desc',
    editingId: null,
    deleting: null,
    categoriesOpen: false,
  })
})

describe('AdminEventsPage', () => {
  it('renders a heading, create dialog, categories dialog, and filters', () => {
    renderWithQueryClient(<AdminEventsPage />)

    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument()
    expect(screen.getByTestId('create-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('categories-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('filters')).toBeInTheDocument()
  })

  it('fetches events with default pagination and no filters', async () => {
    renderWithQueryClient(<AdminEventsPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/events', {
        signal: expect.anything(),
        params: {
          page: 1,
          pageSize: 10,
          status: undefined,
          categoryId: undefined,
          mode: undefined,
          sortOrder: 'desc',
        },
      }),
    )
  })

  it('sends comma-joined status, category, and mode filters', async () => {
    useEventsStore.setState({ statusFilter: ['Published', 'Archived'], categoryFilter: ['cat-1'], modeFilter: ['Online', 'Hybrid'] })

    renderWithQueryClient(<AdminEventsPage />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/events', {
        signal: expect.anything(),
        params: {
          page: 1,
          pageSize: 10,
          status: 'Published,Archived',
          categoryId: 'cat-1',
          mode: 'Online,Hybrid',
          sortOrder: 'desc',
        },
      }),
    )
  })

  it('hides pagination when there are no records', async () => {
    renderWithQueryClient(<AdminEventsPage />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument()
  })

  it('shows pagination when there are records', async () => {
    mockedGet.mockResolvedValue({
      data: { events: [], page: 1, pageSize: 10, totalCount: 5, totalPages: 1, filterOptions: { statuses: [], categories: [], modes: [] } },
    })

    renderWithQueryClient(<AdminEventsPage />)

    expect(await screen.findByText('Rows per page')).toBeInTheDocument()
  })

  it('opens the categories dialog store state when the Categories button is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AdminEventsPage />)

    await user.click(screen.getByRole('button', { name: 'Categories' }))

    expect(useEventsStore.getState().categoriesOpen).toBe(true)
  })

  it('shows an error message instead of the list when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Failed to load events.' } },
    })

    renderWithQueryClient(<AdminEventsPage />)

    expect(await screen.findByText('Failed to load events.')).toBeInTheDocument()
    expect(screen.queryByTestId('event-list')).not.toBeInTheDocument()
  })
})
