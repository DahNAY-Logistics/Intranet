import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'

import EditEntityDialog from './EditEntityDialog'

type Banner = { id: number; title: string }

function renderDialog({
  id = 3,
  queryFn = vi.fn().mockResolvedValue({ id: 3, title: 'Annual day' } satisfies Banner),
}: { id?: number | null; queryFn?: () => Promise<Banner> } = {}) {
  const onOpenChange = vi.fn()
  const user = userEvent.setup()

  renderWithQueryClient(
    <EditEntityDialog<Banner>
      id={id}
      onOpenChange={onOpenChange}
      queryKey={['banners', id]}
      queryFn={queryFn}
      title="Edit banner"
      loadingSkeleton={<p>Loading banner…</p>}
      fallbackError="Failed to load banner."
    >
      {(data, onSuccess) => (
        <div>
          <p>{data.title}</p>
          <button type="button" onClick={onSuccess}>
            Save
          </button>
        </div>
      )}
    </EditEntityDialog>,
  )

  return { user, onOpenChange, queryFn }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('EditEntityDialog', () => {
  it('stays closed and does not fetch when the id is null', () => {
    const queryFn = vi.fn().mockResolvedValue({ id: 3, title: 'Annual day' })
    renderDialog({ id: null, queryFn })

    expect(screen.queryByText('Edit banner')).not.toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('shows the loading skeleton while the item is fetched', async () => {
    renderDialog({ queryFn: vi.fn(() => new Promise<Banner>(() => {})) })

    expect(await screen.findByText('Loading banner…')).toBeInTheDocument()
  })

  it('renders the children with the fetched item', async () => {
    renderDialog()

    expect(await screen.findByText('Annual day')).toBeInTheDocument()
    expect(screen.getByText('Edit banner')).toBeInTheDocument()
  })

  it('closes the dialog when the children call onSuccess', async () => {
    const { user, onOpenChange } = renderDialog()

    await user.click(await screen.findByRole('button', { name: 'Save' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('surfaces the server error when the fetch fails', async () => {
    renderDialog({
      queryFn: vi.fn().mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Banner not found' } } }),
    })

    await waitFor(() => expect(screen.getByText('Banner not found')).toBeInTheDocument())
  })
})
