import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import { apiStatusLabels } from 'core/constants'

import ApiStatus from './ApiStatus'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('ApiStatus', () => {
  it('shows a connecting label while the health check is in flight', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<ApiStatus />)

    expect(screen.getByText('Connecting…')).toBeInTheDocument()
  })

  it('shows the ok label once the health check succeeds', async () => {
    mockedGet.mockResolvedValue({ data: { status: 'ok' } })

    renderWithQueryClient(<ApiStatus />)

    expect(await screen.findByText(apiStatusLabels.ok)).toBeInTheDocument()
  })

  it('shows the down label when the health check fails', async () => {
    mockedGet.mockRejectedValue(new Error('Network Error'))

    renderWithQueryClient(<ApiStatus />)

    expect(await screen.findByText(apiStatusLabels.down)).toBeInTheDocument()
  })

  it('describes the failure in the title attribute', async () => {
    mockedGet.mockRejectedValue(new Error('Network Error'))

    renderWithQueryClient(<ApiStatus />)

    const badge = await screen.findByText(apiStatusLabels.down)

    expect(badge.closest('span[title]')).toHaveAttribute('title', expect.stringContaining('Network Error'))
  })
})
