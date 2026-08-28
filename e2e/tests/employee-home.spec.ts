import { expect, test } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import {
  createAnnouncementViaApi,
  createBannerViaApi,
  createEventViaApi,
  createQuickLinkViaApi,
} from '../fixtures/content-api.js'

test.describe('Home page', () => {
  test('renders the seeded banner, quick link, announcement and event', async ({ page, context }) => {
    await signInAsAdmin(context)
    const banner = await createBannerViaApi(page.request, 'home')
    const quickLink = await createQuickLinkViaApi(page.request, 'home')
    const announcement = await createAnnouncementViaApi(page.request, 'home')
    const event = await createEventViaApi(page.request, 'home')

    await signInAsRegularUser(context, 'home-widgets')

    const bannersResponse = page.waitForResponse(
      (response) => response.url().includes('/api/banners/active') && response.request().method() === 'GET',
    )
    const quickLinksResponse = page.waitForResponse(
      (response) => response.url().includes('/api/quick-links/active') && response.request().method() === 'GET',
    )
    const announcementsResponse = page.waitForResponse(
      (response) => response.url().includes('/api/announcements/active') && response.request().method() === 'GET',
    )
    const eventsResponse = page.waitForResponse(
      (response) => response.url().includes('/api/events/active') && response.request().method() === 'GET',
    )

    await page.goto('/home')

    for (const response of await Promise.all([bannersResponse, quickLinksResponse, announcementsResponse, eventsResponse])) {
      if (response.status() !== 200) {
        throw new Error(`Expected 200 loading ${response.url()}, got ${response.status()}: ${await response.text()}`)
      }
    }

    await page.getByRole('button', { name: 'Close' }).click()

    await expect(page.getByRole('heading', { name: banner.title, exact: true, level: 2 })).toBeVisible()
    await expect(page.getByText(quickLink.title, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: announcement.title, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: event.title, exact: true })).toBeVisible()
  })
})
