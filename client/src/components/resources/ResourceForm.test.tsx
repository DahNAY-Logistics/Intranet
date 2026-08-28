import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useResourcesStore } from '@/stores/resources-store'
import type { ResourceResponse } from 'core/types/resources'
import type { CategoriesResponse } from 'core/types/categories'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('./MarkdownEditor', () => ({
  default: ({ initialValue, onChange }: { initialValue: string; onChange: (value: string) => void }) => (
    <textarea aria-label="Content" defaultValue={initialValue} onChange={(event) => onChange(event.target.value)} />
  ),
}))

import { toast } from 'sonner'

import ResourceForm from './ResourceForm'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedPut = vi.mocked(api.put)

function makeCategoriesResponse(
  categories: CategoriesResponse['categories'] = [{ id: 1, name: 'HR', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }],
): CategoriesResponse {
  return { categories }
}

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
  useResourcesStore.setState({ categoriesOpen: false })
})

function renderForm(props: { resource?: ResourceResponse } = {}, onSuccess = vi.fn()) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <ResourceForm resource={props.resource} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>,
  )
  return { user, onSuccess }
}

describe('ResourceForm (create mode)', () => {
  it('renders all fields once categories load', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm()

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Excerpt')).toBeInTheDocument()
    expect(screen.getByLabelText('URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Content')).toBeInTheDocument()
    expect(await screen.findByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
  })

  it('shows an empty-category prompt and opens the categories dialog when no categories exist', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse([]) })
    const { user } = renderForm()

    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Resource' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Add a category' }))

    expect(useResourcesStore.getState().categoriesOpen).toBe(true)
  })

  it('shows validation errors when submitted empty', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await screen.findByLabelText('Category')
    await user.click(screen.getByRole('button', { name: 'Create Resource' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Excerpt is required')).toBeInTheDocument()
    expect(screen.getByText('Content is required')).toBeInTheDocument()
    expect(screen.getByText('Category is required')).toBeInTheDocument()
    expect(screen.getByText('Status is required')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('does not require a URL', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockResolvedValue({ data: makeResource() })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'Employee handbook')
    await user.type(screen.getByLabelText('Excerpt'), 'Policies, benefits, and everything else you need to know.')
    await user.type(screen.getByLabelText('Content'), 'Welcome to the team.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'HR' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByRole('button', { name: 'Create Resource' }))

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/resources', {
        title: 'Employee handbook',
        excerpt: 'Policies, benefits, and everything else you need to know.',
        content: 'Welcome to the team.',
        categoryId: 1,
        status: 'Published',
      }),
    )
    expect(onSuccess).toHaveBeenCalled()
  })

  it('submits the create payload with a URL', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockResolvedValue({ data: makeResource() })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'Employee handbook')
    await user.type(screen.getByLabelText('Excerpt'), 'Policies, benefits, and everything else you need to know.')
    await user.type(screen.getByLabelText('URL'), 'https://docs.example.com/handbook')
    await user.type(screen.getByLabelText('Content'), 'Welcome to the team.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'HR' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByRole('button', { name: 'Create Resource' }))

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/resources', {
        title: 'Employee handbook',
        excerpt: 'Policies, benefits, and everything else you need to know.',
        url: 'https://docs.example.com/handbook',
        content: 'Welcome to the team.',
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
    await user.type(screen.getByLabelText('Content'), 'Welcome to the team.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'HR' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByRole('button', { name: 'Create Resource' }))

    expect(await screen.findByText('Category not found')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('ResourceForm (edit mode)', () => {
  it('prefills fields from the resource prop', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ resource: makeResource() })

    expect(screen.getByLabelText('Title')).toHaveValue('Employee handbook')
    expect(screen.getByLabelText('Excerpt')).toHaveValue('Policies, benefits, and everything else you need to know.')
    expect(screen.getByLabelText('URL')).toHaveValue('https://docs.example.com/handbook')
    expect(screen.getByLabelText('Content')).toHaveValue('**Welcome** to the team.')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('disables Save until a field changes', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ resource: makeResource() })

    await screen.findByLabelText('Category')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('submits the update payload via PUT /resources/:id', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const resource = makeResource()
    mockedPut.mockResolvedValue({ data: resource })
    const { user } = renderForm({ resource })

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Employee handbook (updated)')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith('/resources/42', {
        title: 'Employee handbook (updated)',
        excerpt: 'Policies, benefits, and everything else you need to know.',
        url: 'https://docs.example.com/handbook',
        content: '**Welcome** to the team.',
        categoryId: 1,
        status: 'Published',
      }),
    )
  })
})
