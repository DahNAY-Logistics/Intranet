import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useQuickLinksStore } from '@/stores/quick-links-store'
import type { QuickLinksFilterOptionsResponse } from 'core/types/quick-links'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

import Filters from './Filters'

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  mockedGet.mockResolvedValue({
    data: { categories: [{ id: 'cat-1', name: 'General', createdAt: '2026-01-01T00:00:00.000Z' }] },
  })
  useQuickLinksStore.setState({ statusFilter: [], categoryFilter: [], sortOrder: 'desc' })
})

function makeFilterOptions(overrides: Partial<QuickLinksFilterOptionsResponse> = {}): QuickLinksFilterOptionsResponse {
  return {
    statuses: [
      { value: 'Published', count: 7 },
      { value: 'Archived', count: 3 },
    ],
    categories: [{ value: 'cat-1', count: 10 }],
    ...overrides,
  }
}

describe('Filters', () => {
  it('does not show a Reset button when nothing is filtered', () => {
    renderWithQueryClient(<Filters filterOptions={makeFilterOptions()} />)

    expect(screen.queryByRole('button', { name: /Reset/ })).not.toBeInTheDocument()
  })

  it('shows a Reset button that clears all filters when something is filtered', async () => {
    useQuickLinksStore.setState({ statusFilter: ['Published'], categoryFilter: ['cat-1'] })
    const user = userEvent.setup()
    renderWithQueryClient(<Filters filterOptions={makeFilterOptions()} />)

    await user.click(screen.getByRole('button', { name: /Reset/ }))

    expect(useQuickLinksStore.getState().statusFilter).toEqual([])
    expect(useQuickLinksStore.getState().categoryFilter).toEqual([])
  })

  it('toggles the sort order label and calls setSortOrder', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<Filters filterOptions={makeFilterOptions()} />)

    expect(screen.getByRole('button', { name: /Newest first/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Newest first/ }))

    expect(useQuickLinksStore.getState().sortOrder).toBe('asc')
    await waitFor(() => expect(screen.getByRole('button', { name: /Oldest first/ })).toBeInTheDocument())
  })
})
