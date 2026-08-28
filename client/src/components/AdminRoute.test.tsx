import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { useSession } from '@/lib/auth-client'
import { roles } from 'core/constants'

import AdminRoute from './AdminRoute'

vi.mock('@/lib/auth-client', () => ({ useSession: vi.fn() }))

const mockedUseSession = vi.mocked(useSession)

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<p>Admin content</p>} />
        </Route>
        <Route path="/home" element={<p>Home</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('AdminRoute', () => {
  it('renders nothing while the session is resolving', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as never)

    renderRoute()

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
  })

  it('renders the nested route for an admin', () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: roles.admin } }, isPending: false } as never)

    renderRoute()

    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })

  it('redirects a non-admin to the home page', () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: roles.user } }, isPending: false } as never)

    renderRoute()

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('redirects when there is no session at all', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as never)

    renderRoute()

    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
