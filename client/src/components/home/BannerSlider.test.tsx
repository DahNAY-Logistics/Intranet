import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { BannersResponse } from 'core/types/banners'

import BannerSlider from './BannerSlider'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

const mockedGet = vi.mocked(api.get)

const mockResponse: BannersResponse = {
  banners: [
    {
      id: 1,
      title: 'Annual day',
      excerpt: 'Join the celebration.',
      status: 'Published',
      displayOrder: 1,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      category: { id: 1, name: 'Culture' },
      postedBy: { name: 'Admin' },
      attachment: { id: 9, url: 'https://cdn.test/banner.jpg' },
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('BannerSlider', () => {
  it('requests the active banners', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWithQueryClient(<BannerSlider />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/banners/active', expect.anything()))
  })

  it('renders the banner image, title and category', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWithQueryClient(<BannerSlider />)

    expect(await screen.findByRole('heading', { name: 'Annual day' })).toBeInTheDocument()
    expect(screen.getByText('Culture')).toBeInTheDocument()
    expect(screen.getByAltText('Annual day')).toHaveAttribute('src', 'https://cdn.test/banner.jpg')
  })

  it('renders a slide counter and one dot per banner', async () => {
    mockedGet.mockResolvedValue({ data: mockResponse })

    renderWithQueryClient(<BannerSlider />)

    expect(await screen.findByText('01 / 01')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annual day' })).toBeInTheDocument()
  })

  it('renders nothing when there are no active banners', async () => {
    mockedGet.mockResolvedValue({ data: { banners: [] } })

    const { container } = renderWithQueryClient(<BannerSlider />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('shows a placeholder block while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<BannerSlider />)

    expect(document.querySelector('.sk-block')).toBeInTheDocument()
  })
})
