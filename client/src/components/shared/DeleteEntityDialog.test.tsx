import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'

import DeleteEntityDialog from './DeleteEntityDialog'

vi.mock('@/lib/api', () => ({ api: { delete: vi.fn() } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockedDelete = vi.mocked(api.delete)

type Banner = { id: number; title: string }

const mockBanner: Banner = { id: 3, title: 'Annual day' }

function renderDialog(item: Banner | null = mockBanner) {
  const onOpenChange = vi.fn()
  const onDeleted = vi.fn()
  const user = userEvent.setup()

  renderWithQueryClient(
    <DeleteEntityDialog
      item={item}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      basePath="/banners"
      invalidateKey={['banners']}
      getTitle={(banner) => banner.title}
      successMessage={(title) => `Banner "${title}" deleted`}
      fallbackError="Failed to delete banner."
      noItemLabel="this banner"
    />,
  )

  return { user, onOpenChange, onDeleted }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('DeleteEntityDialog', () => {
  it('stays closed when there is no item', () => {
    renderDialog(null)

    expect(screen.queryByText(/Delete/)).not.toBeInTheDocument()
  })

  it('names the item in the confirmation title', async () => {
    renderDialog()

    expect(await screen.findByText('Delete "Annual day"?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('deletes the item at the given base path', async () => {
    const { user, onDeleted } = renderDialog()
    mockedDelete.mockResolvedValue({ data: { message: 'ok' } })

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('/banners/3'))
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('surfaces the server error when the delete fails', async () => {
    const { user } = renderDialog()
    mockedDelete.mockRejectedValue({ isAxiosError: true, response: { data: { error: 'Banner not found' } } })

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Banner not found')).toBeInTheDocument()
  })

  it('does not delete when cancelled', async () => {
    const { user } = renderDialog()

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(mockedDelete).not.toHaveBeenCalled()
  })

  it('disables both actions while the delete is in flight', async () => {
    const { user } = renderDialog()
    mockedDelete.mockReturnValue(new Promise(() => {}))

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('button', { name: 'Deleting…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
