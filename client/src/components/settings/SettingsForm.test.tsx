import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { SettingsResponse } from 'core/types/settings'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), put: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'

import SettingsForm from './SettingsForm'

const mockedGet = vi.mocked(api.get)
const mockedPut = vi.mocked(api.put)

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

describe('SettingsForm', () => {
  it('shows skeleton rows while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<SettingsForm />)

    expect(screen.queryByLabelText('Site name')).not.toBeInTheDocument()
  })

  it('renders the loaded settings in the form', async () => {
    mockedGet.mockResolvedValue({ data: makeSettings() })

    renderWithQueryClient(<SettingsForm />)

    expect(await screen.findByDisplayValue('Intranet')).toBeInTheDocument()
    expect(screen.getByDisplayValue('DahNAY Logistics Pvt Ltd')).toBeInTheDocument()
    expect(screen.getByDisplayValue('support@dahnay.com')).toBeInTheDocument()
  })

  it('shows the server error message when loading fails', async () => {
    mockedGet.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Nope' } },
    })

    renderWithQueryClient(<SettingsForm />)

    expect(await screen.findByText('Nope')).toBeInTheDocument()
  })

  it('shows a validation error when the site name is cleared', async () => {
    mockedGet.mockResolvedValue({ data: makeSettings() })
    const user = userEvent.setup()

    renderWithQueryClient(<SettingsForm />)

    const siteName = await screen.findByLabelText('Site name')
    await user.clear(siteName)
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Site name is required')).toBeInTheDocument()
    expect(mockedPut).not.toHaveBeenCalled()
  })

  it('submits the updated values and shows a success toast', async () => {
    mockedGet.mockResolvedValue({ data: makeSettings() })
    mockedPut.mockResolvedValue({ data: { message: 'Settings updated successfully' } })
    const user = userEvent.setup()

    renderWithQueryClient(<SettingsForm />)

    const siteName = await screen.findByLabelText('Site name')
    await user.clear(siteName)
    await user.type(siteName, 'New Name')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith(
        '/settings',
        expect.objectContaining({ siteName: 'New Name' }),
      ),
    )
    expect(toast.success).toHaveBeenCalledWith('Settings updated successfully')
  })

  it('sends null for a cleared optional URL field', async () => {
    mockedGet.mockResolvedValue({ data: makeSettings({ codeOfConductUrl: 'https://example.com/coc' }) })
    mockedPut.mockResolvedValue({ data: { message: 'Settings updated successfully' } })
    const user = userEvent.setup()

    renderWithQueryClient(<SettingsForm />)

    const codeOfConductUrl = await screen.findByLabelText('Code of Conduct URL')
    await user.clear(codeOfConductUrl)
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(mockedPut).toHaveBeenCalledWith(
        '/settings',
        expect.objectContaining({ codeOfConductUrl: null }),
      ),
    )
  })

  it('does not show a success toast when the update fails', async () => {
    mockedGet.mockResolvedValue({ data: makeSettings() })
    mockedPut.mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()

    renderWithQueryClient(<SettingsForm />)

    const siteName = await screen.findByLabelText('Site name')
    await user.clear(siteName)
    await user.type(siteName, 'New Name')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Failed to update settings.')).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
