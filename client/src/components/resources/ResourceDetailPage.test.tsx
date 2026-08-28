import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { ResourceResponse } from 'core/types/resources'

import ResourceDetailPage from './ResourceDetailPage'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function makeResource(overrides: Partial<ResourceResponse> = {}): ResourceResponse {
  return {
    id: 5,
    title: 'Expense policy',
    excerpt: 'How to file a reimbursement.',
    content: 'Submit receipts within 30 days.',
    url: null,
    status: 'Published',
    category: { id: 1, name: 'Finance' },
    postedBy: { name: 'Admin' },
    createdAt: '2026-02-14T00:00:00.000Z',
    ...overrides,
  }
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={['/resources/5']}>
      <Routes>
        <Route path="/resources/:id" element={<ResourceDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('ResourceDetailPage', () => {
  it('requests the resource by the route id', async () => {
    mockedGet.mockResolvedValue({ data: { resource: makeResource() } })

    renderPage()

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/resources/5', expect.anything()))
  })

  it('renders the resource once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { resource: makeResource() } })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Expense policy' })).toBeInTheDocument()
    expect(screen.getByText('How to file a reimbursement.')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('14 Feb 2026')).toBeInTheDocument()
  })

  it('always renders a link back to the library', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('link', { name: /Back to library/ })).toHaveAttribute('href', '/resources')
  })

  it('surfaces the server error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Resource not found' } } })

    renderPage()

    expect(await screen.findByText('Resource not found')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByRole('heading', { name: 'Expense policy' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-line').length).toBeGreaterThan(0)
  })
})
