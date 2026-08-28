import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { set } from 'date-fns'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useEventsStore } from '@/stores/events-store'
import type { EventResponse } from 'core/types/events'
import type { CategoriesResponse } from 'core/types/categories'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect(new Date('2026-02-01T00:00:00.000Z'))}>
      Mock Calendar
    </button>
  ),
}))

import { toast } from 'sonner'

import EventForm from './EventForm'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedPut = vi.mocked(api.put)

function makeCategoriesResponse(categories: CategoriesResponse['categories'] = [{ id: 1, name: 'General', createdAt: '2026-01-01T00:00:00.000Z', count: 0 }]): CategoriesResponse {
  return { categories }
}

function makeEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 42,
    title: 'All-hands kickoff',
    excerpt: 'Quarterly all-hands.',
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
  useEventsStore.setState({ categoriesOpen: false })
})

function renderForm(props: { event?: EventResponse } = {}, onSuccess = vi.fn()) {
  const user = userEvent.setup()
  renderWithQueryClient(
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <EventForm event={props.event} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>,
  )
  return { user, onSuccess }
}

const MOCK_PICKED_DATE = set(new Date('2026-02-01T00:00:00.000Z'), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })

async function pickDates(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: /Pick a date/ })[0]!)
  await user.click(await screen.findByText('Mock Calendar'))
  await user.click(screen.getByRole('button', { name: /Pick a date/ }))
  await user.click(await screen.findByText('Mock Calendar'))
}

describe('EventForm (create mode)', () => {
  it('renders all fields once categories load', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm()

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Excerpt')).toBeInTheDocument()
    expect(await screen.findByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Mode')).toBeInTheDocument()
    expect(screen.getByText('Start Date & Time')).toBeInTheDocument()
    expect(screen.getByText('End Date & Time')).toBeInTheDocument()
  })

  it('shows an empty-category prompt and opens the categories dialog when no categories exist', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse([]) })
    const { user } = renderForm()

    expect(await screen.findByText('No categories yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Event' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Add a category' }))

    expect(useEventsStore.getState().categoriesOpen).toBe(true)
  })

  it('shows validation errors when submitted empty', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await screen.findByLabelText('Category')
    await user.click(screen.getByRole('button', { name: 'Create Event' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Excerpt is required')).toBeInTheDocument()
    expect(screen.getByText('Category is required')).toBeInTheDocument()
    expect(screen.getByText('Status is required')).toBeInTheDocument()
    expect(screen.getByText('Mode is required')).toBeInTheDocument()
    expect(screen.getByText('Start date must be a valid date')).toBeInTheDocument()
    expect(screen.getByText('End date must be a valid date')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('requires location when mode is Hybrid', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await user.click(await screen.findByLabelText('Mode'))
    await user.click(await screen.findByRole('option', { name: 'Hybrid' }))
    await user.click(screen.getByRole('button', { name: 'Create Event' }))

    expect(await screen.findByText('Location is required')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('requires location when mode is Offline', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const { user } = renderForm()

    await user.click(await screen.findByLabelText('Mode'))
    await user.click(await screen.findByRole('option', { name: 'Offline' }))
    await user.click(screen.getByRole('button', { name: 'Create Event' }))

    expect(await screen.findByText('Location is required')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('does not require location when mode is Online', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockResolvedValue({ data: makeEvent({ mode: 'Online', location: '' }) })
    const { user } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'All-hands kickoff')
    await user.type(screen.getByLabelText('Excerpt'), 'Quarterly all-hands.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'General' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByLabelText('Mode'))
    await user.click(await screen.findByRole('option', { name: 'Online' }))

    await user.click(screen.getByRole('button', { name: 'Create Event' }))

    expect(screen.queryByText('Location is required')).not.toBeInTheDocument()
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
    mockedPost.mockResolvedValue({ data: makeEvent() })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'All-hands kickoff')
    await user.type(screen.getByLabelText('Excerpt'), 'Quarterly all-hands.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'General' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByLabelText('Mode'))
    await user.click(await screen.findByRole('option', { name: 'Hybrid' }))
    await user.type(screen.getByLabelText('Location'), 'Main auditorium')
    await pickDates(user)
    await user.click(screen.getByRole('button', { name: 'Create Event' }))

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/events', {
        title: 'All-hands kickoff',
        excerpt: 'Quarterly all-hands.',
        categoryId: 1,
        status: 'Published',
        mode: 'Hybrid',
        location: 'Main auditorium',
        startDate: MOCK_PICKED_DATE,
        endDate: MOCK_PICKED_DATE,
      }),
    )
    expect(onSuccess).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('"All-hands kickoff" created successfully')
  })

  it('shows the server error message inline on failure', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Category not found' } },
    })
    const { user, onSuccess } = renderForm()

    await user.type(screen.getByLabelText('Title'), 'All-hands kickoff')
    await user.type(screen.getByLabelText('Excerpt'), 'Quarterly all-hands.')
    await user.click(await screen.findByLabelText('Category'))
    await user.click(await screen.findByRole('option', { name: 'General' }))
    await user.click(screen.getByLabelText('Status'))
    await user.click(await screen.findByRole('option', { name: 'Published' }))
    await user.click(screen.getByLabelText('Mode'))
    await user.click(await screen.findByRole('option', { name: 'Online' }))
    await pickDates(user)
    await user.click(screen.getByRole('button', { name: 'Create Event' }))

    expect(await screen.findByText('Category not found')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('EventForm (edit mode)', () => {
  it('prefills fields from the event prop', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ event: makeEvent() })

    expect(screen.getByLabelText('Title')).toHaveValue('All-hands kickoff')
    expect(screen.getByLabelText('Excerpt')).toHaveValue('Quarterly all-hands.')
    expect(screen.getByLabelText('Location')).toHaveValue('Main auditorium')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('disables Save until a field changes', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    renderForm({ event: makeEvent() })

    await screen.findByLabelText('Category')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('submits the update payload via PUT /events/:id', async () => {
    mockedGet.mockResolvedValue({ data: makeCategoriesResponse() })
    const event = makeEvent()
    mockedPut.mockResolvedValue({ data: event })
    const { user } = renderForm({ event })

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'All-hands kickoff (updated)')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith('/events/42', {
        title: 'All-hands kickoff (updated)',
        excerpt: 'Quarterly all-hands.',
        categoryId: 1,
        status: 'Published',
        mode: 'Hybrid',
        location: 'Main auditorium',
        startDate: new Date('2026-01-01T10:00:00.000Z'),
        endDate: new Date('2026-01-01T12:00:00.000Z'),
      }),
    )
  })
})
