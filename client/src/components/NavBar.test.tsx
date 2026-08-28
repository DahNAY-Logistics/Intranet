import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { api } from '@/lib/api'
import { useSession } from '@/lib/auth-client'
import { renderWithQueryClient } from '@/test/render'
import { roles } from 'core/constants'

import NavBar from './NavBar'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))
vi.mock('@/lib/auth-client', () => ({ useSession: vi.fn(), signOut: vi.fn() }))

const mockedGet = vi.mocked(api.get)
const mockedUseSession = vi.mocked(useSession)

const mockMe = { id: 'u1', name: 'Ada Lovelace', email: 'ada@dahnay.com', image: null, role: 'User', employeeId: 'EMP-001' }

function mockEndpoints(siteName = 'Intranet') {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/me') return Promise.resolve({ data: mockMe })
    if (url === '/settings') {
      return Promise.resolve({
        data: {
          siteName,
          organizationName: 'Dahnay',
          supportEmail: null,
          codeOfConductUrl: null,
          privacyPolicyUrl: null,
          maintenanceMode: false,
        },
      })
    }
    return new Promise(() => {})
  })
}

function renderNav(initialEntry = '/home') {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={[initialEntry]}>
      <NavBar />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedUseSession.mockReturnValue({ data: { user: { role: roles.user } }, isPending: false } as never)
})

describe('NavBar', () => {
  it('renders the site name and monogram from settings', async () => {
    mockEndpoints('Dahnay Hub')

    renderNav()

    expect(await screen.findAllByText('Dahnay Hub')).not.toHaveLength(0)
    expect(screen.getAllByText('DA').length).toBeGreaterThan(0)
  })

  it('falls back to a default site name before settings load', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderNav()

    expect(screen.getAllByText('Intranet').length).toBeGreaterThan(0)
  })

  it('hides the admin link from a non-admin', async () => {
    mockEndpoints()

    renderNav()

    await screen.findAllByText('Intranet')

    expect(document.querySelector('a[href="/admin"]')).not.toBeInTheDocument()
  })

  it('shows the admin link to an admin', async () => {
    mockedUseSession.mockReturnValue({ data: { user: { role: roles.admin } }, isPending: false } as never)
    mockEndpoints()

    renderNav()

    await screen.findAllByText('Intranet')

    const adminLinks = Array.from(document.querySelectorAll('a[href="/admin"]'))

    expect(adminLinks.length).toBeGreaterThan(0)
  })

  it('marks the current route as the active nav link', async () => {
    mockEndpoints()

    renderNav('/announcements')

    const active = await screen.findAllByRole('link', { name: 'Announcements' })

    expect(active.some((link) => link.className.includes('nav-link-active'))).toBe(true)
  })

  it('renders the profile trigger once the profile resolves', async () => {
    mockEndpoints()

    renderNav()

    expect(await screen.findByText('AL')).toBeInTheDocument()
  })
})
