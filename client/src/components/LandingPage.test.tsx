import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

import { signIn, useSession } from '@/lib/auth-client'
import { useSignInStore } from '@/stores/sign-in-store'
import { commonMessages } from 'core/messages'

import LandingPage from './LandingPage'

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
  signIn: { oauth2: vi.fn() },
}))

const mockedUseSession = vi.mocked(useSession)
const mockedOauth2 = vi.mocked(signIn.oauth2)

function renderPage(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<p>Home</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  useSignInStore.setState({ error: null })
  mockedUseSession.mockReturnValue({ data: null, isPending: false } as never)
})

describe('LandingPage', () => {
  it('renders the heading and sign-in button', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: /Every route/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeInTheDocument()
  })

  it('redirects to home when a session already exists', () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: 'User' } }, isPending: false } as never)

    renderPage()

    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('starts the zoho oauth flow when sign in is clicked', async () => {
    const user = userEvent.setup()
    mockedOauth2.mockResolvedValue({ error: null } as never)

    renderPage()

    await user.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() =>
      expect(mockedOauth2).toHaveBeenCalledWith(expect.objectContaining({ providerId: 'zoho', callbackURL: '/home' })),
    )
  })

  it('shows the access denied message when the callback carries an error', () => {
    renderPage('/?error=access_denied')

    expect(screen.getByRole('alert')).toHaveTextContent(commonMessages.ACCESS_DENIED)
  })

  it('shows the store error when sign-in could not be reached', async () => {
    const user = userEvent.setup()
    mockedOauth2.mockResolvedValue({ error: { message: 'nope' } } as never)

    renderPage()

    await user.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(commonMessages.SIGNIN_UNREACHABLE)
  })

  it('disables the button while the session is still resolving', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as never)

    renderPage()

    expect(screen.getByRole('button', { name: /Sign in/ })).toBeDisabled()
  })
})
