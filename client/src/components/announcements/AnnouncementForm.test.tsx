import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAnnouncementsStore } from '@/stores/announcements-store'
import type { AnnouncementResponse } from 'core/types/announcements'
import type { CategoriesResponse } from 'core/types/categories'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'

import AnnouncementForm from './AnnouncementForm'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedPut = vi.mocked(api.put)

function makeCategoriesResponse(categories: CategoriesResponse['categories'] = [{ id: 1, name: 'General', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }]): CategoriesResponse {
  return { categories }
}

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
  useAnnouncementsStore.setState({ categoriesOpen: false })
})

function renderForm(props: { announcement?: AnnouncementResponse } = {}, onSuccess = vi.fn()) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <AnnouncementForm announcement={props.announcement} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>,
  )
  return { user, onSuccess }
}

describe('AnnouncementForm (create mode)', () => {
  it('renders all fields once categories load', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm()

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Excerpt')).toBeInTheDocument()
    expect(await screen.findByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
  })

  it('shows an empty-category prompt and opens the categories dialog when no categories exist', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse([]) })
    const { user } = renderForm()

    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Announcement' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Add a category' }))

    expect(useAnnouncementsStore.getState().categoriesOpen).toBe(true)
  })

  it('shows validation errors when submitted empty', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await screen.findByLabelText('Category')
    await user.click(screen.getByRole('button', { name: 'Create Announcement' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Excerpt is required')).toBeInTheDocument()
    expect(screen.getByText('Category is required')).toBeInTheDocument()
    expect(screen.getByText('Status is required')).toBeInTheDocument()
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
    mockedPost.mockResolvedValue({ data: makeAnnouncement() })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'Office closed')
    await user.type(screen.getByLabelText('Excerpt'), 'Office closed for the holiday.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'General' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByRole('button', { name: 'Create Announcement' }))

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/announcements', {
        title: 'Office closed',
        excerpt: 'Office closed for the holiday.',
        categoryId: 1,
        status: 'Published',
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
    await user.click(screen.getByRole('button', { name: 'Create Announcement' }))

    expect(await screen.findByText('Category not found')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('AnnouncementForm (edit mode)', () => {
  it('prefills fields from the announcement prop', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ announcement: makeAnnouncement() })

    expect(screen.getByLabelText('Title')).toHaveValue('Office closed')
    expect(screen.getByLabelText('Excerpt')).toHaveValue('Office closed for the holiday.')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('disables Save until a field changes', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ announcement: makeAnnouncement() })

    await screen.findByLabelText('Category')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('submits the update payload via PUT /announcements/:id', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const announcement = makeAnnouncement()
    mockedPut.mockResolvedValue({ data: announcement })
    const { user } = renderForm({ announcement })

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Office closed early')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith('/announcements/42', {
        title: 'Office closed early',
        excerpt: 'Office closed for the holiday.',
        categoryId: 1,
        status: 'Published',
      }),
    )
  })
})
