import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useBannersStore } from '@/stores/banners-store'
import type { BannerResponse } from 'core/types/banners'
import type { CategoriesResponse } from 'core/types/categories'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/ImageUploadField', () => ({
  default: ({ onChange }: { onChange: (id: number | null) => void }) => (
    <button type="button" onClick={() => onChange(2)}>
      Mock Upload
    </button>
  ),
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect(new Date('2026-02-01T00:00:00.000Z'))}>
      Mock Calendar
    </button>
  ),
}))

import { toast } from 'sonner'

import BannerForm from './BannerForm'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedPut = vi.mocked(api.put)

const MOCK_DATE = new Date('2026-02-01T00:00:00.000Z')

function makeCategoriesResponse(categories: CategoriesResponse['categories'] = [{ id: 1, name: 'General', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }]): CategoriesResponse {
  return { categories }
}

function makeBanner(overrides: Partial<BannerResponse> = {}): BannerResponse {
  return {
    id: 42,
    title: 'Office closed',
    excerpt: 'Office closed for the holiday.',
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
  useBannersStore.setState({ categoriesOpen: false })
})

function renderForm(props: { banner?: BannerResponse } = {}, onSuccess = vi.fn()) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <BannerForm banner={props.banner} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>,
  )
  return { user, onSuccess }
}

async function pickDates(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: 'Pick a date' })[0]!)
  await user.click(await screen.findByText('Mock Calendar'))
  await user.click(screen.getByRole('button', { name: 'Pick a date' }))
  await user.click(await screen.findByText('Mock Calendar'))
}

describe('BannerForm (create mode)', () => {
  it('renders all fields once categories load', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm()

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Excerpt')).toBeInTheDocument()
    expect(await screen.findByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByText('Start Date')).toBeInTheDocument()
    expect(screen.getByText('End Date')).toBeInTheDocument()
    expect(screen.getByText('Mock Upload')).toBeInTheDocument()
  })

  it('shows an empty-category prompt and opens the categories dialog when no categories exist', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse([]) })
    const { user } = renderForm()

    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Banner' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Add a category' }))

    expect(useBannersStore.getState().categoriesOpen).toBe(true)
  })

  it('shows validation errors when submitted empty', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await screen.findByLabelText('Category')
    await user.click(screen.getByRole('button', { name: 'Create Banner' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Excerpt is required')).toBeInTheDocument()
    expect(screen.getByText('Category is required')).toBeInTheDocument()
    expect(screen.getByText('Banner image is required')).toBeInTheDocument()
    expect(screen.getByText('Status is required')).toBeInTheDocument()
    expect(screen.getByText('Start date must be a valid date')).toBeInTheDocument()
    expect(screen.getByText('End date must be a valid date')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('displays the selected category name, not its id, in the trigger', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'General' }))

    expect(screen.getByLabelText('Category')).toHaveTextContent('General')
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('submits the create payload', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockResolvedValue({ data: makeBanner() })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'Office closed')
    await user.type(screen.getByLabelText('Excerpt'), 'Office closed for the holiday.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'General' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByText('Mock Upload'))
    await pickDates(user)
    await user.click(screen.getByRole('button', { name: 'Create Banner' }))

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/banners', {
        title: 'Office closed',
        excerpt: 'Office closed for the holiday.',
        categoryId: 1,
        attachmentId: 2,
        status: 'Published',
        startDate: MOCK_DATE,
        endDate: MOCK_DATE,
      }),
    )
    expect(onSuccess).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('"Office closed" created successfully')
  })

  it('shows the server error message inline on failure', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Category not found' } },
    })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'Office closed')
    await user.type(screen.getByLabelText('Excerpt'), 'Office closed for the holiday.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'General' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByText('Mock Upload'))
    await pickDates(user)
    await user.click(screen.getByRole('button', { name: 'Create Banner' }))

    expect(await screen.findByText('Category not found')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('BannerForm (edit mode)', () => {
  it('prefills fields from the banner prop', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ banner: makeBanner() })

    expect(screen.getByLabelText('Title')).toHaveValue('Office closed')
    expect(screen.getByLabelText('Excerpt')).toHaveValue('Office closed for the holiday.')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('disables Save until a field changes', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ banner: makeBanner() })

    await screen.findByLabelText('Category')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('submits the update payload via PUT /banners/:id', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const banner = makeBanner()
    mockedPut.mockResolvedValue({ data: banner })
    const { user } = renderForm({ banner })

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Office closed early')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith('/banners/42', {
        title: 'Office closed early',
        excerpt: 'Office closed for the holiday.',
        categoryId: 1,
        attachmentId: 1,
        status: 'Published',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-01-10T00:00:00.000Z'),
      }),
    )
  })
})
