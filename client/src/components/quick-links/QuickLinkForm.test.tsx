import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useQuickLinksStore } from '@/stores/quick-links-store'
import type { QuickLinkResponse } from 'core/types/quick-links'
import type { CategoriesResponse } from 'core/types/categories'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'

import QuickLinkForm from './QuickLinkForm'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedPut = vi.mocked(api.put)

function makeCategoriesResponse(categories: CategoriesResponse['categories'] = [{ id: 1, name: 'HR', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }]): CategoriesResponse {
  return { categories }
}

function makeQuickLink(overrides: Partial<QuickLinkResponse> = {}): QuickLinkResponse {
  return {
    id: 42,
    title: 'Employee handbook',
    excerpt: 'Policies, benefits, and everything else you need to know.',
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
  useQuickLinksStore.setState({ categoriesOpen: false })
})

function renderForm(props: { quickLink?: QuickLinkResponse } = {}, onSuccess = vi.fn()) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <QuickLinkForm quickLink={props.quickLink} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>,
  )
  return { user, onSuccess }
}

describe('QuickLinkForm (create mode)', () => {
  it('renders all fields once categories load', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm()

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Excerpt')).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(await screen.findByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
  })

  it('shows an empty-category prompt and opens the categories dialog when no categories exist', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse([]) })
    const { user } = renderForm()

    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Quick Link' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Add a category' }))

    expect(useQuickLinksStore.getState().categoriesOpen).toBe(true)
  })

  it('shows validation errors when submitted empty', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await screen.findByLabelText('Category')
    await user.click(screen.getByRole('button', { name: 'Create Quick Link' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Excerpt is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid URL')).toBeInTheDocument()
    expect(screen.getByText('Category is required')).toBeInTheDocument()
    expect(screen.getByText('Status is required')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('shows an error when the URL is not valid', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await screen.findByLabelText('Category')
    await user.type(screen.getByLabelText('URL'), 'not-a-url')
    await user.click(screen.getByRole('button', { name: 'Create Quick Link' }))

    expect(await screen.findByText('Enter a valid URL')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('submits the create payload', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockResolvedValue({ data: makeQuickLink() })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'Employee handbook')
    await user.type(screen.getByLabelText('Excerpt'), 'Policies, benefits, and everything else you need to know.')
    await user.type(screen.getByLabelText('URL'), 'https://docs.example.com/handbook')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'HR' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByRole('button', { name: 'Create Quick Link' }))

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/quick-links', {
        title: 'Employee handbook',
        excerpt: 'Policies, benefits, and everything else you need to know.',
        url: 'https://docs.example.com/handbook',
        categoryId: 1,
        status: 'Published',
      }),
    )
    expect(onSuccess).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('"Employee handbook" created successfully')
  })

  it('shows the server error message inline on failure', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Category not found' } },
    })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'Employee handbook')
    await user.type(screen.getByLabelText('Excerpt'), 'Policies, benefits, and everything else you need to know.')
    await user.type(screen.getByLabelText('URL'), 'https://docs.example.com/handbook')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'HR' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByRole('button', { name: 'Create Quick Link' }))

    expect(await screen.findByText('Category not found')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('QuickLinkForm (edit mode)', () => {
  it('prefills fields from the quickLink prop', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ quickLink: makeQuickLink() })

    expect(screen.getByLabelText('Title')).toHaveValue('Employee handbook')
    expect(screen.getByLabelText('Excerpt')).toHaveValue('Policies, benefits, and everything else you need to know.')
    expect(screen.getByLabelText('URL')).toHaveValue('https://docs.example.com/handbook')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('disables Save until a field changes', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ quickLink: makeQuickLink() })

    await screen.findByLabelText('Category')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('submits the update payload via PUT /quick-links/:id', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const quickLink = makeQuickLink()
    mockedPut.mockResolvedValue({ data: quickLink })
    const { user } = renderForm({ quickLink })

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Employee handbook (updated)')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith('/quick-links/42', {
        title: 'Employee handbook (updated)',
        excerpt: 'Policies, benefits, and everything else you need to know.',
        url: 'https://docs.example.com/handbook',
        categoryId: 1,
        status: 'Published',
      }),
    )
  })
})
