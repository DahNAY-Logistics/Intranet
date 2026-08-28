import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { BannerResponse } from 'core/types/banners'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import AdminBannerDetailPage from './AdminBannerDetailPage'

const mockedGet = vi.mocked(api.get)

function makeBanner(overrides: Partial<BannerResponse> = {}): BannerResponse {
  return {
    id: 42,
    title: 'Summer sale kickoff',
    excerpt: 'Short summary shown on the banner.',
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

beforeEach(() => {
  vi.resetAllMocks()
})

function renderDetailPage(id = '42') {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={[`/admin/banners/${id}`]}>
      <Routes>
        <Route path="/admin/banners/:id" element={<AdminBannerDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminBannerDetailPage', () => {
  it('renders a back link to the banners list', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/admin/banners')
  })

  it('shows a loading state while fetching', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.queryByRole('heading', { name: 'Summer sale kickoff' })).not.toBeInTheDocument()
  })

  it('renders the full banner details once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { banner: makeBanner() } })

    const { container } = renderDetailPage()

    expect(await screen.findByRole('heading', { name: 'Summer sale kickoff' })).toBeInTheDocument()
    expect(screen.getByText('Short summary shown on the banner.')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Posted by Admin')).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://blob/att-1.jpg')
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Banner not found' } },
    })

    renderDetailPage()

    expect(await screen.findByText('Banner not found')).toBeInTheDocument()
  })

  it('opens the edit dialog when the edit button is clicked', async () => {
    mockedGet.mockImplementation((url: string) =>
      url === '/banners/42'
        ? Promise.resolve({ data: { banner: makeBanner() } })
        : Promise.resolve({ data: { categories: [{ id: 1, name: 'General', createdAt: '2026-01-01T00:00:00.000Z' }] } }),
    )
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'Summer sale kickoff' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-pencil'))!)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('opens the delete confirmation when the delete button is clicked', async () => {
    mockedGet.mockResolvedValue({ data: { banner: makeBanner() } })
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'Summer sale kickoff' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash2'))!)

    expect(await screen.findByText('Delete "Summer sale kickoff"?')).toBeInTheDocument()
  })
})
