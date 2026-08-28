import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'

import Masthead from './Masthead'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

function mockEndpoints({ name, siteName }: { name?: string; siteName?: string }) {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/me') {
      return name
        ? Promise.resolve({
            data: { id: 'u1', name, email: 'a@dahnay.com', image: null, role: 'User', employeeId: null },
          })
        : new Promise(() => {})
    }

    if (url === '/settings') {
      return siteName
        ? Promise.resolve({
            data: {
              siteName,
              organizationName: 'Dahnay',
              supportEmail: null,
              codeOfConductUrl: null,
              privacyPolicyUrl: null,
              maintenanceMode: false,
            },
          })
        : new Promise(() => {})
    }

    return new Promise(() => {})
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Masthead', () => {
  it('greets the signed-in user by name', async () => {
    mockEndpoints({ name: 'Ada', siteName: 'Intranet' })

    renderWithQueryClient(<Masthead />)

    expect(await screen.findByText(/Hola, Ada/)).toBeInTheDocument()
  })

  it('greets without a name until the profile resolves', () => {
    mockEndpoints({ siteName: 'Intranet' })

    renderWithQueryClient(<Masthead />)

    expect(screen.getByText(/Hola/)).toBeInTheDocument()
    expect(screen.queryByText(/Hola,/)).not.toBeInTheDocument()
  })

  it('renders the configured site name in the dispatch channel', async () => {
    mockEndpoints({ name: 'Ada', siteName: 'Dahnay Hub' })

    renderWithQueryClient(<Masthead />)

    expect(await screen.findByText(/Dahnay Hub\/\/Dispatch/)).toBeInTheDocument()
  })

  it('falls back to a default site name before settings load', () => {
    mockEndpoints({ name: 'Ada' })

    renderWithQueryClient(<Masthead />)

    expect(screen.getByText(/Intranet\/\/Dispatch/)).toBeInTheDocument()
  })
})
