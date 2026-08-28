import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { useSession } from '@/lib/auth-client'

import ProtectedRoute from './ProtectedRoute'

vi.mock('@/lib/auth-client', () => ({ useSession: vi.fn() }))

const mockedUseSession = vi.mocked(useSession)

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<p>Protected content</p>} />
        </Route>
        <Route path="/" element={<p>Landing</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('ProtectedRoute', () => {
  it('renders nothing while the session is resolving', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as never)

    renderRoute()

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(screen.queryByText('Landing')).not.toBeInTheDocument()
  })

  it('renders the nested route when a session exists', () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: 'User' } }, isPending: false } as never)

    renderRoute()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects to the landing page when there is no session', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as never)

    renderRoute()

    expect(screen.getByText('Landing')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
