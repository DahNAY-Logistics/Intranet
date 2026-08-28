import { expect, test } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { createResourceViaApi } from '../fixtures/content-api.js'
import { widenFeedPageSize } from '../fixtures/feed-pagination.js'

test.describe('Resources feed', () => {
  test('lists a seeded resource and opens its detail page', async ({ page, context }) => {
    await signInAsAdmin(context)
    const resource = await createResourceViaApi(page.request, 'feed')

    await signInAsRegularUser(context, 'resources-feed')
    await widenFeedPageSize(page, '/api/resources')

    const listResponse = page.waitForResponse(
      (response) => response.url().includes('/api/resources?') && response.request().method() === 'GET',
    )
    await page.goto('/resources')
    const response = await listResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 loading the resources feed, got ${response.status()}: ${await response.text()}`)
    }

    await page.getByRole('link', { name: resource.title, exact: true }).click()

    await page.waitForURL(`/resources/${resource.id}`)
    await expect(page.getByRole('heading', { name: resource.title, exact: true, level: 1 })).toBeVisible()
  })
})
