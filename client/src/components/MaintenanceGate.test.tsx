import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { api } from '@/lib/api'
import { useSession } from '@/lib/auth-client'
import type { SettingsResponse } from 'core/types/settings'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}))

import MaintenanceGate from './MaintenanceGate'

const mockedGet = vi.mocked(api.get)
const mockedUseSession = vi.mocked(useSession)

function makeSettings(overrides: Partial<SettingsResponse> = {}): SettingsResponse {
  return {
    siteName: 'Intranet',
    organizationName: 'DahNAY Logistics Pvt Ltd',
    supportEmail: 'support@dahnay.com',
    codeOfConductUrl: null,
    privacyPolicyUrl: null,
    maintenanceMode: false,
    ...overrides,
  }
}

function renderGate() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<MaintenanceGate />}>
            <Route path="/" element={<div>App content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('MaintenanceGate', () => {
  it('lets an admin through regardless of maintenance mode', async () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: 'Admin' } } } as never)
    mockedGet.mockResolvedValue({ data: makeSettings({ maintenanceMode: true }) })

    renderGate()

    expect(await screen.findByText('App content')).toBeInTheDocument()
  })

  it('shows the maintenance page to a non-admin when maintenance mode is on', async () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: 'User' } } } as never)
    mockedGet.mockResolvedValue({ data: makeSettings({ maintenanceMode: true }) })

    renderGate()

    expect(await screen.findByText('Under Maintenance')).toBeInTheDocument()
    expect(screen.queryByText('App content')).not.toBeInTheDocument()
  })

  it('lets a non-admin through when maintenance mode is off', async () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: 'User' } } } as never)
    mockedGet.mockResolvedValue({ data: makeSettings({ maintenanceMode: false }) })

    renderGate()

    expect(await screen.findByText('App content')).toBeInTheDocument()
  })
})
