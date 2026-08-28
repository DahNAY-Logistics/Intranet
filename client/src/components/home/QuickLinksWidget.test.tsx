import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { QuickLinksActiveResponse } from 'core/types/quick-links'

import QuickLinksWidget from './QuickLinksWidget'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

const mockResponse: QuickLinksActiveResponse = {
  quickLinks: [
    {
      id: 1,
      title: 'Payroll portal',
      excerpt: 'Payslips and tax documents.',
      url: 'https://payroll.example.com',
      status: 'Published',
      category: { id: 1, name: 'HR' },
      postedBy: { name: 'Admin' },
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('QuickLinksWidget', () => {
  it('requests the active quick links', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWithQueryClient(<QuickLinksWidget />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/quick-links/active', expect.anything()))
  })

  it('renders each quick link with its category and external href', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWithQueryClient(<QuickLinksWidget />)

    expect(await screen.findByText('Payroll portal')).toBeInTheDocument()
    expect(screen.getByText('HR')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://payroll.example.com')
  })

  it('shows the entry count once loaded', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWithQueryClient(<QuickLinksWidget />)

    expect(await screen.findByText('01 entries')).toBeInTheDocument()
  })

  it('shows an empty message when there are no quick links', async () => {
    mockedGet.mockResolvedValue({ data: { quickLinks: [] } })

    renderWithQueryClient(<QuickLinksWidget />)

    expect(await screen.findByText('No quick links yet.')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<QuickLinksWidget />)

    expect(screen.queryByText('No quick links yet.')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-line').length).toBeGreaterThan(0)
  })
})
