import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { EventResponse } from 'core/types/events'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import AdminEventDetailPage from './AdminEventDetailPage'

const mockedGet = vi.mocked(api.get)

function makeEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 42,
    title: 'All-hands kickoff',
    excerpt: 'Quarterly all-hands with leadership updates.',
    status: 'Published',
    mode: 'Hybrid',
    location: 'Main auditorium',
    startDate: '2026-01-01T10:00:00.000Z',
    endDate: '2026-01-01T12:00:00.000Z',
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
    <MemoryRouter initialEntries={[`/admin/events/${id}`]}>
      <Routes>
        <Route path="/admin/events/:id" element={<AdminEventDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminEventDetailPage', () => {
  it('renders a back link to the events list', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/admin/events')
  })

  it('shows a loading state while fetching', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.queryByRole('heading', { name: 'All-hands kickoff' })).not.toBeInTheDocument()
  })

  it('renders the full event details once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { event: makeEvent() } })

    renderDetailPage()

    expect(await screen.findByRole('heading', { name: 'All-hands kickoff' })).toBeInTheDocument()
    expect(screen.getByText('Quarterly all-hands with leadership updates.')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
    expect(screen.getByText('Main auditorium')).toBeInTheDocument()
    expect(screen.getByText('Posted by Admin')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Event not found' } },
    })

    renderDetailPage()

    expect(await screen.findByText('Event not found')).toBeInTheDocument()
  })

  it('opens the edit dialog when the edit button is clicked', async () => {
    mockedGet.mockImplementation((url: string) =>
      url === '/events/42'
        ? Promise.resolve({ data: { event: makeEvent() } })
        : Promise.resolve({ data: { categories: [{ id: 1, name: 'General', createdAt: '2026-01-01T00:00:00.000Z' }] } }),
    )
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'All-hands kickoff' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-pencil'))!)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('opens the delete confirmation when the delete button is clicked', async () => {
    mockedGet.mockResolvedValue({ data: { event: makeEvent() } })
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'All-hands kickoff' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash2'))!)

    expect(await screen.findByText('Delete "All-hands kickoff"?')).toBeInTheDocument()
  })
})
