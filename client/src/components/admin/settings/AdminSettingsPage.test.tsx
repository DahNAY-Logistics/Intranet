import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { SettingsResponse } from 'core/types/settings'

import AdminSettingsPage from './AdminSettingsPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), put: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

const mockSettings: SettingsResponse = {
  siteName: 'Intranet',
  organizationName: 'Dahnay',
  supportEmail: 'help@dahnay.com',
  codeOfConductUrl: null,
  privacyPolicyUrl: null,
  maintenanceMode: false,
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AdminSettingsPage', () => {
  it('renders the page heading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<AdminSettingsPage />)

    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
  })

  it('requests the settings', async () => {
    mockedGet.mockResolvedValue({ data: mockSettings })

    renderWithQueryClient(<AdminSettingsPage />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/settings', expect.anything()))
  })

  it('renders the settings form once loaded', async () => {
    mockedGet.mockResolvedValue({ data: mockSettings })

    renderWithQueryClient(<AdminSettingsPage />)

    expect(await screen.findByDisplayValue('Intranet')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dahnay')).toBeInTheDocument()
  })

  it('shows placeholders while the settings load', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<AdminSettingsPage />)

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })
})
