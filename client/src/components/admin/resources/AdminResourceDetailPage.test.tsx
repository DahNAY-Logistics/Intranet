import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { ResourceResponse } from 'core/types/resources'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import AdminResourceDetailPage from './AdminResourceDetailPage'

const mockedGet = vi.mocked(api.get)

function makeResource(overrides: Partial<ResourceResponse> = {}): ResourceResponse {
  return {
    id: 42,
    title: 'Employee handbook',
    excerpt: 'Policies, benefits, and everything else you need to know.',
    content: '**Welcome** to the team.',
    url: 'https://docs.example.com/handbook',
    status: 'Published',
    category: { id: 1, name: 'HR' },
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
    <MemoryRouter initialEntries={[`/admin/resources/${id}`]}>
      <Routes>
        <Route path="/admin/resources/:id" element={<AdminResourceDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminResourceDetailPage', () => {
  it('renders a back link to the resources list', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/admin/resources')
  })

  it('shows a loading state while fetching', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderDetailPage()

    expect(screen.queryByRole('heading', { name: 'Employee handbook' })).not.toBeInTheDocument()
  })

  it('renders the full resource details once loaded', async () => {
    mockedGet.mockResolvedValue({ data: { resource: makeResource() } })

    renderDetailPage()

    expect(await screen.findByRole('heading', { name: 'Employee handbook' })).toBeInTheDocument()
    expect(screen.getByText('Policies, benefits, and everything else you need to know.')).toBeInTheDocument()
    expect(screen.getByText('HR')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Posted by Admin')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://docs.example.com/handbook' })).toHaveAttribute(
      'href',
      'https://docs.example.com/handbook',
    )
    expect(screen.getByText('Welcome').tagName).toBe('STRONG')
  })

  it('does not render a URL link when the resource has none', async () => {
    mockedGet.mockResolvedValue({ data: { resource: makeResource({ url: null }) } })

    renderDetailPage()

    await screen.findByRole('heading', { name: 'Employee handbook' })
    expect(screen.queryByRole('link', { name: /docs\.example\.com/ })).not.toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Resource not found' } },
    })

    renderDetailPage()

    expect(await screen.findByText('Resource not found')).toBeInTheDocument()
  })

  it('opens the edit dialog when the edit button is clicked', async () => {
    mockedGet.mockImplementation((url: string) =>
      url === '/resources/42'
        ? Promise.resolve({ data: { resource: makeResource() } })
        : Promise.resolve({ data: { categories: [{ id: 1, name: 'HR', createdAt: '2026-01-01T00:00:00.000Z' }] } }),
    )
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'Employee handbook' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-pencil'))!)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('opens the delete confirmation when the delete button is clicked', async () => {
    mockedGet.mockResolvedValue({ data: { resource: makeResource() } })
    const user = userEvent.setup()

    renderDetailPage()
    await screen.findByRole('heading', { name: 'Employee handbook' })

    await user.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash2'))!)

    expect(await screen.findByText('Delete "Employee handbook"?')).toBeInTheDocument()
  })
})
