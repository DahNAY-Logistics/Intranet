import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { api } from '@/lib/api'
import { useUsersAdminStore } from '@/stores/users-admin-store'
import { renderWithQueryClient } from '@/test/render'

import DesignationsDialog from './DesignationsDialog'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  useUsersAdminStore.getState().setDesignationsOpen(false)
})

describe('DesignationsDialog', () => {
  it('stays closed while the store flag is false', () => {
    renderWithQueryClient(<DesignationsDialog />)

    expect(screen.queryByText('Designations')).not.toBeInTheDocument()
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('opens from the store and fetches the designations endpoint', async () => {
    mockedGet.mockResolvedValue({ data: { categories: [] } })
    useUsersAdminStore.getState().setDesignationsOpen(true)

    renderWithQueryClient(<DesignationsDialog />)

    expect(await screen.findByText('Designations')).toBeInTheDocument()
    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/users/designations', expect.anything()))
  })

  it('labels the create field for a designation', async () => {
    mockedGet.mockResolvedValue({ data: { categories: [] } })
    useUsersAdminStore.getState().setDesignationsOpen(true)

    renderWithQueryClient(<DesignationsDialog />)

    expect(await screen.findByPlaceholderText('New designation name')).toBeInTheDocument()
  })

  it('renders the fetched designations', async () => {
    mockedGet.mockResolvedValue({
      data: { categories: [{ id: 1, name: 'Principal Engineer', createdAt: '2026-01-01T00:00:00.000Z', count: 2 }] },
    })
    useUsersAdminStore.getState().setDesignationsOpen(true)

    renderWithQueryClient(<DesignationsDialog />)

    expect(await screen.findByText('Principal Engineer')).toBeInTheDocument()
  })
})
