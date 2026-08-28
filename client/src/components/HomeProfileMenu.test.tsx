import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'
import type { MeResponse } from 'core/types/users'

import HomeProfileMenu from './HomeProfileMenu'

vi.mock('@/lib/auth-client', () => ({ signOut: vi.fn() }))

const mockedSignOut = vi.mocked(signOut)

function makeMe(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@dahnay.com',
    image: null,
    role: 'User',
    employeeId: 'EMP-001',
    ...overrides,
  }
}

function renderMenu(me: MeResponse = makeMe()) {
  const user = userEvent.setup()

  render(
    <MemoryRouter>
      <HomeProfileMenu me={me} trigger={<Button />}>
        <span>Open profile</span>
      </HomeProfileMenu>
    </MemoryRouter>,
  )

  return { user }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('HomeProfileMenu', () => {
  it('shows the name, email and employee id when opened', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button'))

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@dahnay.com')).toBeInTheDocument()
    expect(screen.getByText('ID: EMP-001')).toBeInTheDocument()
  })

  it('does not render an avatar inside the menu', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button'))

    await screen.findByText('Ada Lovelace')
    expect(screen.queryByText('AL')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('omits the employee id row when the user has none', async () => {
    const { user } = renderMenu(makeMe({ employeeId: null }))

    await user.click(screen.getByRole('button'))

    await screen.findByText('Ada Lovelace')
    expect(screen.queryByText(/^ID:/)).not.toBeInTheDocument()
  })

  it('signs the user out when the sign out item is clicked', async () => {
    mockedSignOut.mockResolvedValue(undefined as never)
    const { user } = renderMenu()

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Sign out'))

    await waitFor(() => expect(mockedSignOut).toHaveBeenCalled())
  })
})
