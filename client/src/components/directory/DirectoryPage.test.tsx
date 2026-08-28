import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { DirectoryResponse } from 'core/types/directory'

import DirectoryPage from './DirectoryPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function makeResponse(overrides: Partial<DirectoryResponse> = {}): DirectoryResponse {
  return {
    entries: [
      {
        id: 'u1',
        name: 'Ada Lovelace',
        email: 'ada@dahnay.com',
        image: null,
        employeeId: 'EMP-001',
        reportedTo: null,
        department: { id: 1, name: 'Engineering' },
        designation: { id: 2, name: 'Principal Engineer' },
        location: { id: 3, name: 'Chennai' },
        joinedDate: '2026-01-01T00:00:00.000Z',
      },
    ],
    page: 1,
    pageSize: 12,
    totalCount: 1,
    totalPages: 1,
    filterOptions: { departments: [], designations: [], locations: [] },
    ...overrides,
  }
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter>
      <DirectoryPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('DirectoryPage', () => {
  it('requests the directory on mount', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/directory', expect.anything()))
  })

  it('renders the page heading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Directory' })).toBeInTheDocument()
  })

  it('renders a card per entry once loaded', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Principal Engineer')).toBeInTheDocument()
  })

  it('keeps what the user types in the search box', async () => {
    const user = userEvent.setup()
    mockedGet.mockResolvedValue({ data: makeResponse() })

    renderPage()

    const input = screen.getByPlaceholderText('Search by name, email, or employee ID...')
    await user.type(input, 'ada')

    expect(input).toHaveValue('ada')
  })

  it('shows an empty message when nobody matches', async () => {
    mockedGet.mockResolvedValue({ data: makeResponse({ entries: [], totalCount: 0 }) })

    renderPage()

    expect(await screen.findByText('No matching staff found.')).toBeInTheDocument()
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Invalid query parameters' } } })

    renderPage()

    expect(await screen.findByText('Invalid query parameters')).toBeInTheDocument()
  })
})
