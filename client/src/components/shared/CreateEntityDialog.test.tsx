import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'

import CreateEntityDialog from './CreateEntityDialog'

function renderDialog(children = vi.fn(() => <p>Form body</p>)) {
  const user = userEvent.setup()

  render(
    <CreateEntityDialog triggerLabel="New banner" triggerIcon={<Plus />} title="Create banner">
      {children}
    </CreateEntityDialog>,
  )

  return { user, children }
}

describe('CreateEntityDialog', () => {
  it('renders the trigger and keeps the dialog closed initially', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: /New banner/ })).toBeInTheDocument()
    expect(screen.queryByText('Create banner')).not.toBeInTheDocument()
  })

  it('opens the dialog and renders the form body on trigger click', async () => {
    const { user } = renderDialog()

    await user.click(screen.getByRole('button', { name: /New banner/ }))

    expect(await screen.findByText('Create banner')).toBeInTheDocument()
    expect(screen.getByText('Form body')).toBeInTheDocument()
  })

  it('passes the open state down to the render prop', async () => {
    const children = vi.fn(() => <p>Form body</p>)
    const { user } = renderDialog(children)

    expect(children).toHaveBeenCalledWith(expect.objectContaining({ open: false }))

    await user.click(screen.getByRole('button', { name: /New banner/ }))

    await screen.findByText('Create banner')
    expect(children).toHaveBeenCalledWith(expect.objectContaining({ open: true }))
  })

  it('closes the dialog when the render prop calls onSuccess', async () => {
    const user = userEvent.setup()

    render(
      <CreateEntityDialog triggerLabel="New banner" triggerIcon={<Plus />} title="Create banner">
        {({ onSuccess }) => (
          <button type="button" onClick={onSuccess}>
            Save
          </button>
        )}
      </CreateEntityDialog>,
    )

    await user.click(screen.getByRole('button', { name: /New banner/ }))
    await user.click(await screen.findByRole('button', { name: 'Save' }))

    expect(screen.queryByText('Create banner')).not.toBeInTheDocument()
  })
})
