import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

import CreateUserDialog from './CreateUserDialog'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('CreateUserDialog', () => {
  it('does not show the dialog before the trigger is clicked', () => {
    renderWithQueryClient(<CreateUserDialog />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the dialog when the trigger button is clicked', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<CreateUserDialog />)

    await user.click(screen.getByRole('button', { name: 'Create User' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('hides the dialog when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<CreateUserDialog />)

    await user.click(screen.getByRole('button', { name: 'Create User' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('hides the dialog when clicking outside of it', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<CreateUserDialog />)

    await user.click(screen.getByRole('button', { name: 'Create User' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const overlay = document.querySelector('[data-slot="dialog-overlay"]')
    expect(overlay).toBeInTheDocument()
    await user.click(overlay!)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
