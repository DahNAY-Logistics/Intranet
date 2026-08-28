import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { AnnouncementResponse } from 'core/types/announcements'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import AdminAnnouncementDetailPage from './AdminAnnouncementDetailPage'

const mockedGet = vi.mocked(api.get)

function makeAnnouncement(overrides: Partial<AnnouncementResponse> = {}): AnnouncementResponse {
  return {
    id: 42,
    title: 'Office closed',
    excerpt: 'Office closed for the holiday.',
    status: 'Published',
    category: { id: 1, name: 'General' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

function renderDetailPage(id = '42') {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={[`/admin/announcements/${id}`]}>
      <Routes>
        <Route path="/admin/announcements/:id" element={<AdminAnnouncementDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminAnnouncementDetailPage', () => {
  it('renders a back link to the announcements list', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/admin/announcements')
  })

  it('shows a loading state while fetching', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.queryByRole('heading', { name: 'Office closed' })).not.toBeInTheDocument()
  })

  it('renders the full announcement details once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { announcement: makeAnnouncement() } })

    renderDetailPage()

    expect(await screen.findByRole('heading', { name: 'Office closed' })).toBeInTheDocument()
    expect(screen.getByText('Office closed for the holiday.')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Posted by Admin')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Announcement not found' } },
    })

    renderDetailPage()

    expect(await screen.findByText('Announcement not found')).toBeInTheDocument()
  })

  it('opens the edit dialog when the edit button is clicked', async () => {
    mockedGet.mockImplementation((url: string) =>
      url === '/announcements/42'
        ? Promise.resolve({ data: { announcement: makeAnnouncement() } })
        : Promise.resolve({ data: { categories: [{ id: 1, name: 'General', createdAt: '2026-01-01T00:00:00.000Z' }] } }),
    )
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'Office closed' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-pencil'))!)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('opens the delete confirmation when the delete button is clicked', async () => {
    mockedGet.mockResolvedValue({ data: { announcement: makeAnnouncement() } })
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'Office closed' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash2'))!)

    expect(await screen.findByText('Delete "Office closed"?')).toBeInTheDocument()
  })
})
