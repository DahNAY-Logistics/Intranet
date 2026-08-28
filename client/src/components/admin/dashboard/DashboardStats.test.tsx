import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { DashboardStatsResponse } from 'core/types/dashboard'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

import DashboardStats from './DashboardStats'

const mockedGet = vi.mocked(api.get)

function makeStats(overrides: Partial<DashboardStatsResponse> = {}): DashboardStatsResponse {
  return {
    publishedAnnouncements: 2,
    publishedEvents: 3,
    totalQuickLinks: 4,
    totalBanners: 5,
    totalResources: 6,
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('DashboardStats', () => {
  it('shows loading skeletons while fetching', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<DashboardStats />)

    expect(document.querySelectorAll('[data-slot="card"]').length).toBe(5)
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Failed to load dashboard stats.' } },
    })

    renderWithQueryClient(<DashboardStats />)

    expect(await screen.findByText('Failed to load dashboard stats.')).toBeInTheDocument()
  })

  it('renders all five stat cards with their counts', async () => {
    mockedGet.mockResolvedValue({ data: makeStats() })

    renderWithQueryClient(<DashboardStats />)

    expect(await screen.findByText('Published Announcements')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Published Events')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Total Quick Links')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Total Banners')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Total Resources')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('requests /dashboard/stats', async () => {
    mockedGet.mockResolvedValue({ data: makeStats() })

    renderWithQueryClient(<DashboardStats />)

    await screen.findByText('Published Announcements')
    expect(mockedGet).toHaveBeenCalledWith('/dashboard/stats', expect.objectContaining({ signal: expect.anything() }))
  })
})
