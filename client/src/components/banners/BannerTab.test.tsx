import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useBannersStore } from '@/stores/banners-store'
import { bannerStatuses } from 'core/constants'
import type { BannerResponse, BannersResponse } from 'core/types/banners'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import BannerTab from './BannerTab'

const mockedGet = vi.mocked(api.get)

function makeBanner(overrides: Partial<BannerResponse> = {}): BannerResponse {
  return {
    id: 42,
    title: 'Office closed',
    excerpt: 'Office closed for the holiday.',
    status: 'Published',
    displayOrder: 1,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-01-10T00:00:00.000Z',
    category: { id: 1, name: 'General' },
    postedBy: { name: 'Admin' },
    attachment: { id: 1, url: 'http://blob/att-1.jpg' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeBannersResponse(banners: BannerResponse[]): BannersResponse {
  return { banners }
}

beforeEach(() => {
  vi.resetAllMocks()
  useBannersStore.setState({ editingId: null, deleting: null })
})

function renderTab(status: 'Published' | 'Archived' = bannerStatuses.published) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <MemoryRouter>
      <BannerTab status={status} />
    </MemoryRouter>,
  )
  return { user }
}

describe('BannerTab', () => {
  it('shows loading skeletons while fetching', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderTab()

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Failed to load banners.' } },
    })

    renderTab()

    expect(await screen.findByText('Failed to load banners.')).toBeInTheDocument()
    expect(screen.queryByText('No published banners yet.')).not.toBeInTheDocument()
  })

  it('shows an empty state for the Published tab', async () => {
    mockedGet.mockResolvedValue({ data: makeBannersResponse([]) })

    renderTab(bannerStatuses.published)

    expect(await screen.findByText('No published banners yet.')).toBeInTheDocument()
  })

  it('shows an empty state for the Archived tab', async () => {
    mockedGet.mockResolvedValue({ data: makeBannersResponse([]) })

    renderTab(bannerStatuses.archived)

    expect(await screen.findByText('No archived banners.')).toBeInTheDocument()
  })

  it('renders banner cards for the Published tab', async () => {
    mockedGet.mockResolvedValue({ data: makeBannersResponse([makeBanner({ title: 'Office closed' })]) })

    renderTab(bannerStatuses.published)

    expect(await screen.findByText('Office closed')).toBeInTheDocument()
  })

  it('renders banner cards for the Archived tab', async () => {
    mockedGet.mockResolvedValue({
      data: makeBannersResponse([makeBanner({ title: 'Old notice', status: 'Archived' })]),
    })

    renderTab(bannerStatuses.archived)

    expect(await screen.findByText('Old notice')).toBeInTheDocument()
  })

  it('sets editingId in the store when a card Edit button is clicked', async () => {
    const banner = makeBanner({ id: 42 })
    mockedGet.mockImplementation((url: string) => {
      if (url === '/banners/42') return Promise.resolve({ data: { banner } })
      if (url === '/banners/categories') return Promise.resolve({ data: { categories: [] } })
      return Promise.resolve({ data: makeBannersResponse([banner]) })
    })
    const { user } = renderTab(bannerStatuses.archived)

    await screen.findByText('Office closed')
    await user.click(screen.getAllByRole('button')[0]!)

    expect(useBannersStore.getState().editingId).toBe(42)
  })

  it('sets deleting in the store when a card Delete button is clicked', async () => {
    const banner = makeBanner({ id: 42 })
    mockedGet.mockResolvedValue({ data: makeBannersResponse([banner]) })
    const { user } = renderTab(bannerStatuses.archived)

    await screen.findByText('Office closed')
    await user.click(screen.getAllByRole('button')[1]!)

    expect(useBannersStore.getState().deleting).toEqual(banner)
  })
})
