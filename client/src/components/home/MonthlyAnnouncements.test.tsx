import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { AnnouncementsActiveResponse } from 'core/types/announcements'

import MonthlyAnnouncements from './MonthlyAnnouncements'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

const mockResponse: AnnouncementsActiveResponse = {
  announcements: [
    {
      id: 3,
      title: 'Holiday notice',
      excerpt: 'Office closed Friday.',
      status: 'Published',
      category: { id: 1, name: 'General' },
      postedBy: { name: 'Admin' },
      createdAt: '2026-01-05T00:00:00.000Z',
    },
  ],
}

function renderWidget() {
  return renderWithQueryClient(
    <MemoryRouter>
      <MonthlyAnnouncements />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('MonthlyAnnouncements', () => {
  it('requests the active announcements scoped to the current month', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWidget()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        '/announcements/active',
        expect.objectContaining({ params: { month: expect.stringMatching(/^\d{4}-\d{2}$/) } }),
      ),
    )
  })

  it('renders each announcement with a link to its detail page', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWidget()

    expect(await screen.findByText('Holiday notice')).toBeInTheDocument()
    expect(screen.getByText('Office closed Friday.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Holiday notice' })).toHaveAttribute('href', '/announcements/3')
  })

  it('links to the full announcements page', () => {
    mockedGet.mockResolvedValue({ data: { announcements: [] } })

    renderWidget()

    expect(screen.getByRole('link', { name: /View all/ })).toHaveAttribute('href', '/announcements')
  })

  it('shows an empty message when there are none this month', async () => {
    mockedGet.mockResolvedValue({ data: { announcements: [] } })

    renderWidget()

    expect(await screen.findByText('No announcements this month.')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWidget()

    expect(screen.queryByText('No announcements this month.')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-line').length).toBeGreaterThan(0)
  })
})
