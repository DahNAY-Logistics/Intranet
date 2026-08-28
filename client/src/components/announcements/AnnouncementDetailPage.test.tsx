import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { AnnouncementResponse } from 'core/types/announcements'

import AnnouncementDetailPage from './AnnouncementDetailPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

const mockAnnouncement: AnnouncementResponse = {
  id: 4,
  title: 'Holiday notice',
  excerpt: 'Office closed Friday.',
  status: 'Published',
  category: { id: 1, name: 'General' },
  postedBy: { name: 'Priya' },
  createdAt: '2026-03-09T00:00:00.000Z',
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={['/announcements/4']}>
      <Routes>
        <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AnnouncementDetailPage', () => {
  it('requests the announcement by the route id', async () => {
    mockedGet.mockResolvedValue({ data: { announcement: mockAnnouncement } })

    renderPage()

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/announcements/4', expect.anything()))
  })

  it('renders the announcement once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { announcement: mockAnnouncement } })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Holiday notice' })).toBeInTheDocument()
    expect(screen.getByText('Office closed Friday.')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('shows the posted date and author in the meta line', async () => {
    mockedGet.mockResolvedValue({ data: { announcement: mockAnnouncement } })

    renderPage()

    expect(await screen.findByText(/March 9, 2026 · Posted by Priya/)).toBeInTheDocument()
  })

  it('always renders a link back to the bulletin', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('link', { name: /Back to bulletin/ })).toHaveAttribute('href', '/announcements')
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Announcement not found' } } })

    renderPage()

    expect(await screen.findByText('Announcement not found')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByRole('heading', { name: 'Holiday notice' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-line').length).toBeGreaterThan(0)
  })
})
