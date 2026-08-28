import { expect, test } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { createAnnouncementViaApi } from '../fixtures/content-api.js'
import { widenFeedPageSize } from '../fixtures/feed-pagination.js'

test.describe('Announcements feed', () => {
  test('shows a Published announcement and hides an Archived one', async ({ page, context }) => {
    await signInAsAdmin(context)
    const published = await createAnnouncementViaApi(page.request, 'feed-published', 'Published')
    const archived = await createAnnouncementViaApi(page.request, 'feed-archived', 'Archived')

    await signInAsRegularUser(context, 'announcements-feed')
    await widenFeedPageSize(page, '/api/announcements')

    const listResponse = page.waitForResponse(
      (response) => response.url().includes('/api/announcements?') && response.request().method() === 'GET',
    )
    await page.goto('/announcements')
    const response = await listResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 loading the announcements feed, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('link', { name: published.title, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: archived.title, exact: true })).not.toBeVisible()
  })

  test('a direct visit to an archived announcement detail URL does not render it', async ({ page, context }) => {
    await signInAsAdmin(context)
    const archived = await createAnnouncementViaApi(page.request, 'detail-hidden', 'Archived')

    await signInAsRegularUser(context, 'announcements-detail-hidden')

    const detailResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/announcements/${archived.id}`) && response.request().method() === 'GET',
    )
    await page.goto(`/announcements/${archived.id}`)
    const response = await detailResponse
    expect(response.status()).toBe(404)

    await expect(page.getByRole('alert')).toContainText('Announcement not found')
    await expect(page.getByRole('heading', { name: archived.title, exact: true, level: 1 })).not.toBeVisible()
  })
})

test.describe('Announcement detail', () => {
  test('clicking a card in the feed opens the detail page', async ({ page, context }) => {
    await signInAsAdmin(context)
    const announcement = await createAnnouncementViaApi(page.request, 'detail')

    await signInAsRegularUser(context, 'announcements-detail')
    await widenFeedPageSize(page, '/api/announcements')
    await page.goto('/announcements')

    await page.getByRole('link', { name: announcement.title, exact: true }).click()

    await page.waitForURL(`/announcements/${announcement.id}`)
    await expect(page.getByRole('heading', { name: announcement.title, exact: true, level: 1 })).toBeVisible()
  })
})
