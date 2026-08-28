import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'

import RecentlyJoinedWidget from './RecentlyJoinedWidget'

function renderWidget() {
  return renderWithQueryClient(
    <MemoryRouter>
      <RecentlyJoinedWidget />
    </MemoryRouter>,
  )
}

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('RecentlyJoinedWidget', () => {
  it('requests the recently joined highlight', async () => {
    mockedGet.mockResolvedValue({ data: { recentlyJoined: [] } })

    renderWidget()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/users/highlights/recently-joined', expect.anything()),
    )
  })

  it('renders each joiner with their department', async () => {
    mockedGet.mockResolvedValue({
      data: {
        recentlyJoined: [
          { id: 'u1', name: 'Ada Lovelace', joinedDate: '2026-06-01T00:00:00.000Z', department: { id: 1, name: 'Engineering' } },
        ],
      },
    })

    renderWidget()

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
  })

  it('shows an empty message when nobody joined', async () => {
    mockedGet.mockResolvedValue({ data: { recentlyJoined: [] } })

    renderWidget()

    expect(await screen.findByText('No one has joined this month yet.')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWidget()

    expect(screen.queryByText('No one has joined this month yet.')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-line').length).toBeGreaterThan(0)
  })
})
