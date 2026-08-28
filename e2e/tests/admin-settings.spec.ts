import { expect, test } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import {
  uniqueOrganizationName,
  uniqueSettingsUrl,
  uniqueSiteName,
  uniqueSupportEmail,
} from '../fixtures/settings-data.js'

interface SettingsShape {
  siteName: string
  organizationName: string
  supportEmail: string
  codeOfConductUrl: string | null
  privacyPolicyUrl: string | null
  maintenanceMode: boolean
}

test.describe('Navigate to Settings', () => {
  test('an admin reaches the settings page from the sidebar', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin')

    await page.getByRole('link', { name: 'Settings' }).click()

    await page.waitForURL('/admin/settings')
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Site name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()
  })
})

test.describe('Update Settings', () => {
  test.describe.configure({ mode: 'serial' })

  let updatedSiteName = ''

  test('an admin updates settings through the real API and the change persists after a reload', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/settings')

    const siteNameInput = page.getByLabel('Site name')
    await expect(siteNameInput).toBeVisible()
    const originalSiteName = await siteNameInput.inputValue()

    const siteName = uniqueSiteName('update')
    const organizationName = uniqueOrganizationName('update')
    const supportEmail = uniqueSupportEmail('update')
    const codeOfConductUrl = uniqueSettingsUrl('coc-update')
    const privacyPolicyUrl = uniqueSettingsUrl('privacy-update')

    await siteNameInput.fill(siteName)
    await page.getByLabel('Organization name').fill(organizationName)
    await page.getByLabel('Support email').fill(supportEmail)
    await page.getByLabel('Code of Conduct URL').fill(codeOfConductUrl)
    await page.getByLabel('Privacy Policy URL').fill(privacyPolicyUrl)

    const updateResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/settings') && response.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating settings, got ${response.status()}: ${await response.text()}`)
    }

    await expect(siteNameInput).toHaveValue(siteName)
    await expect(siteNameInput).not.toHaveValue(originalSiteName)

    await page.reload()
    await expect(page.getByLabel('Site name')).toHaveValue(siteName)
    await expect(page.getByLabel('Organization name')).toHaveValue(organizationName)
    await expect(page.getByLabel('Support email')).toHaveValue(supportEmail)
    await expect(page.getByLabel('Code of Conduct URL')).toHaveValue(codeOfConductUrl)
    await expect(page.getByLabel('Privacy Policy URL')).toHaveValue(privacyPolicyUrl)
    await expect(page.getByLabel('Site name')).not.toHaveValue(originalSiteName)

    updatedSiteName = siteName
  })

  test('an admin clears an optional URL field and the null value persists after a reload', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/settings')

    const codeOfConductUrlInput = page.getByLabel('Code of Conduct URL')
    await expect(codeOfConductUrlInput).toBeVisible()
    await expect(codeOfConductUrlInput).not.toHaveValue('')

    await codeOfConductUrlInput.fill('')
    await page.getByLabel('Privacy Policy URL').fill('')

    const updateResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/settings') && response.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 clearing settings URLs, got ${response.status()}: ${await response.text()}`)
    }

    await page.reload()
    await expect(page.getByLabel('Code of Conduct URL')).toHaveValue('')
    await expect(page.getByLabel('Privacy Policy URL')).toHaveValue('')

    const getResponse = await page.request.get('/api/settings')
    if (getResponse.status() !== 200) {
      throw new Error(`Expected 200 reading settings, got ${getResponse.status()}: ${await getResponse.text()}`)
    }
    const body: SettingsShape = await getResponse.json()
    expect(body.codeOfConductUrl).toBeNull()
    expect(body.privacyPolicyUrl).toBeNull()
  })

  test('a non-admin sees the updated site name reflected on a real page load', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'settings-read')
    await page.goto('/home')

    await page.getByRole('button', { name: 'Close' }).click()

    await expect(page.getByRole('link', { name: updatedSiteName })).toBeVisible()
  })
})

test.describe('Read Settings', () => {
  test('a non-admin can read settings through the real API', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'settings-get')

    const response = await page.request.get('/api/settings')
    if (response.status() !== 200) {
      throw new Error(`Expected 200 reading settings, got ${response.status()}: ${await response.text()}`)
    }

    const body: SettingsShape = await response.json()
    expect(typeof body.siteName).toBe('string')
    expect(typeof body.organizationName).toBe('string')
    expect(typeof body.supportEmail).toBe('string')
    expect(typeof body.maintenanceMode).toBe('boolean')
    expect(body.codeOfConductUrl === null || typeof body.codeOfConductUrl === 'string').toBe(true)
    expect(body.privacyPolicyUrl === null || typeof body.privacyPolicyUrl === 'string').toBe(true)
  })

  test('a non-admin cannot update settings through the real API', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'settings-put')

    const response = await page.request.put('/api/settings', {
      data: {
        siteName: uniqueSiteName('forbidden'),
        organizationName: uniqueOrganizationName('forbidden'),
        supportEmail: uniqueSupportEmail('forbidden'),
        codeOfConductUrl: null,
        privacyPolicyUrl: null,
        maintenanceMode: false,
      },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin is redirected away from the admin settings page', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'settings-route')

    await page.goto('/admin/settings')

    await page.waitForURL('/home')
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByText(/Hola/)).toBeVisible()
  })
})
