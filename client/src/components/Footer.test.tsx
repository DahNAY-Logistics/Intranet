import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { SettingsResponse } from 'core/types/settings'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}))

import Footer from './Footer'

const mockedGet = vi.mocked(api.get)

function makeSettings(overrides: Partial<SettingsResponse> = {}): SettingsResponse {
  return {
    siteName: 'Intranet',
    organizationName: 'DahNAY Logistics Pvt Ltd',
    supportEmail: 'support@dahnay.com',
    codeOfConductUrl: null,
    privacyPolicyUrl: null,
    maintenanceMode: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Footer', () => {
  it('shows the organization name and support email once loaded', async () => {
    mockedGet.mockResolvedValue({ data: makeSettings() })

    renderWithQueryClient(<Footer />)

    expect(await screen.findByText(/DahNAY Logistics Pvt Ltd/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute(
      'href',
      'mailto:support@dahnay.com',
    )
  })

  it('hides the Code of Conduct and Privacy Policy links when their URLs are unset', async () => {
    mockedGet.mockResolvedValue({ data: makeSettings() })

    renderWithQueryClient(<Footer />)

    await screen.findByText(/DahNAY Logistics Pvt Ltd/)
    expect(screen.queryByRole('link', { name: 'Code of Conduct' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Privacy Policy' })).not.toBeInTheDocument()
  })

  it('shows the Code of Conduct and Privacy Policy links when their URLs are set', async () => {
    mockedGet.mockResolvedValue({
      data: makeSettings({
        codeOfConductUrl: 'https://example.com/code-of-conduct',
        privacyPolicyUrl: 'https://example.com/privacy-policy',
      }),
    })

    renderWithQueryClient(<Footer />)

    expect(await screen.findByRole('link', { name: 'Code of Conduct' })).toHaveAttribute(
      'href',
      'https://example.com/code-of-conduct',
    )
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      'https://example.com/privacy-policy',
    )
  })
})
