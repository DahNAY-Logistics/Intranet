import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { api } from '@/lib/api'
import { useUsersAdminStore } from '@/stores/users-admin-store'
import { renderWithQueryClient } from '@/test/render'

import LocationsDialog from './LocationsDialog'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  useUsersAdminStore.getState().setLocationsOpen(false)
})

describe('LocationsDialog', () => {
  it('stays closed while the store flag is false', () => {
    renderWithQueryClient(<LocationsDialog />)

    expect(screen.queryByText('Locations')).not.toBeInTheDocument()
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('opens from the store and fetches the locations endpoint', async () => {
    mockedGet.mockResolvedValue({ data: { categories: [] } })
    useUsersAdminStore.getState().setLocationsOpen(true)

    renderWithQueryClient(<LocationsDialog />)

    expect(await screen.findByText('Locations')).toBeInTheDocument()
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/users/locations', expect.anything()))
  })

  it('labels the create field for a location', async () => {
    mockedGet.mockResolvedValue({ data: { categories: [] } })
    useUsersAdminStore.getState().setLocationsOpen(true)

    renderWithQueryClient(<LocationsDialog />)

    expect(await screen.findByPlaceholderText('New location name')).toBeInTheDocument()
  })

  it('renders the fetched locations', async () => {
    mockedGet.mockResolvedValue({
      data: { categories: [{ id: 3, name: 'Chennai', createdAt: '2026-01-01T00:00:00.000Z', count: 6 }] },
    })
    useUsersAdminStore.getState().setLocationsOpen(true)

    renderWithQueryClient(<LocationsDialog />)

    expect(await screen.findByText('Chennai')).toBeInTheDocument()
  })
})
