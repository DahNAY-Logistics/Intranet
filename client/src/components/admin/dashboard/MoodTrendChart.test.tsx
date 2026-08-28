import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { MoodTrendResponse } from 'core/types/dashboard'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

import MoodTrendChart from './MoodTrendChart'

const mockedGet = vi.mocked(api.get)

function makeTrend(overrides: Partial<MoodTrendResponse> = {}): MoodTrendResponse {
  return {
    range: 'weekly',
    data: [
      {
        date: '2026-08-22',
        label: 'Aug 22',
        axisLabel: '22',
        isTick: true,
        VeryHappy: 1,
        Happy: 0,
        Neutral: 0,
        Sad: 0,
        VerySad: 0,
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('MoodTrendChart', () => {
  it('shows a loading skeleton while fetching', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<MoodTrendChart />)

    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Failed to load mood check-in data.' } },
    })

    renderWithQueryClient(<MoodTrendChart />)

    expect(await screen.findByText('Failed to load mood check-in data.')).toBeInTheDocument()
  })

  it('requests the weekly range by default', async () => {
    mockedGet.mockResolvedValue({ data: makeTrend() })

    renderWithQueryClient(<MoodTrendChart />)

    await screen.findByText('Mood Check-ins')
    expect(mockedGet).toHaveBeenCalledWith(
      '/dashboard/mood-trend',
      expect.objectContaining({ params: { range: 'weekly' } }),
    )
  })

  it('re-fetches with the monthly range when the Monthly tab is clicked', async () => {
    mockedGet.mockResolvedValue({ data: makeTrend() })
    const user = userEvent.setup()

    renderWithQueryClient(<MoodTrendChart />)
    await screen.findByText('Mood Check-ins')

    await user.click(screen.getByRole('tab', { name: 'Monthly' }))

    expect(await screen.findByText('Mood Check-ins')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledWith(
      '/dashboard/mood-trend',
      expect.objectContaining({ params: { range: 'monthly' } }),
    )
  })
})
