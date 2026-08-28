import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'

import AdminDashboardPage from './AdminDashboardPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

const mockStats = {
  publishedAnnouncements: 4,
  publishedEvents: 2,
  totalQuickLinks: 7,
  totalBanners: 1,
  totalResources: 9,
}

function mockEndpoints() {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/dashboard/stats') return Promise.resolve({ data: mockStats })
    if (url === '/dashboard/mood-trend') return Promise.resolve({ data: { range: 'weekly', data: [] } })
    return new Promise(() => {})
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AdminDashboardPage', () => {
  it('renders the page heading', () => {
    mockEndpoints()

    renderWithQueryClient(<AdminDashboardPage />)

    expect(screen.getByRole('heading', { name: 'Admin', level: 1 })).toBeInTheDocument()
  })

  it('requests both the stats and the mood trend', async () => {
    mockEndpoints()

    renderWithQueryClient(<AdminDashboardPage />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/dashboard/stats', expect.anything()))
    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/dashboard/mood-trend', expect.anything()),
    )
  })

  it('renders the stat values once loaded', async () => {
    mockEndpoints()

    renderWithQueryClient(<AdminDashboardPage />)

    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('renders the mood check-in chart card', async () => {
    mockEndpoints()

    renderWithQueryClient(<AdminDashboardPage />)

    expect(await screen.findByText('Mood Check-ins')).toBeInTheDocument()
  })
})
