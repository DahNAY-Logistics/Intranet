import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'
import type { CategoriesResponse } from 'core/types/categories'

import CategoriesDialog from './CategoriesDialog'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)

const mockCategories: CategoriesResponse = {
  categories: [
    { id: 1, name: 'General', createdAt: '2026-01-01T00:00:00.000Z', count: 3 },
    { id: 2, name: 'Culture', createdAt: '2026-01-02T00:00:00.000Z', count: 0 },
  ],
}

function renderDialog(open = true) {
  const onOpenChange = vi.fn()
  const user = userEvent.setup()

  renderWithQueryClient(
    <CategoriesDialog
      open={open}
      onOpenChange={onOpenChange}
      basePath="/announcements/categories"
      queryKey={['announcements', 'categories']}
      title="Manage categories"
      entityLabel="Category"
      description="Add, rename or remove categories."
    />,
  )

  return { user, onOpenChange }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('CategoriesDialog', () => {
  it('does not fetch while closed', () => {
    renderDialog(false)

    expect(mockedGet).not.toHaveBeenCalled()
    expect(screen.queryByText('Manage categories')).not.toBeInTheDocument()
  })

  it('fetches the categories when opened', async () => {
    mockedGet.mockResolvedValue({ data: mockCategories })

    renderDialog()

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/announcements/categories', expect.anything()),
    )
  })

  it('renders the title, description and each category', async () => {
    mockedGet.mockResolvedValue({ data: mockCategories })

    renderDialog()

    expect(await screen.findByText('Manage categories')).toBeInTheDocument()
    expect(screen.getByText('Add, rename or remove categories.')).toBeInTheDocument()
    expect(await screen.findByText('General')).toBeInTheDocument()
    expect(screen.getByText('Culture')).toBeInTheDocument()
  })

  it('shows an empty message when there are no categories', async () => {
    mockedGet.mockResolvedValue({ data: { categories: [] } })

    renderDialog()

    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
  })

  it('disables the add button until a name is typed', async () => {
    mockedGet.mockResolvedValue({ data: mockCategories })

    const { user } = renderDialog()

    const input = await screen.findByPlaceholderText('New category name')
    const addButton = input.closest('form')!.querySelector('button[type="submit"]')!

    expect(addButton).toBeDisabled()

    await user.type(input, 'Finance')

    await waitFor(() => expect(addButton).toBeEnabled())
  })

  it('creates a category on submit', async () => {
    mockedGet.mockResolvedValue({ data: mockCategories })
    mockedPost.mockResolvedValue({ data: { message: 'ok' } })

    const { user } = renderDialog()

    const input = await screen.findByPlaceholderText('New category name')
    await user.type(input, 'Finance')
    await user.click(input.closest('form')!.querySelector('button[type="submit"]')!)

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/announcements/categories', { name: 'Finance' }),
    )
  })

  it('surfaces the server error when the list fails to load', async () => {
    mockedGet.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Invalid request parameters' } } })

    renderDialog()

    expect(await screen.findByText('Invalid request parameters')).toBeInTheDocument()
  })
})
