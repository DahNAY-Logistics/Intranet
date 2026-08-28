import { expect, test } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { createEventViaApi } from '../fixtures/content-api.js'
import { widenFeedPageSize } from '../fixtures/feed-pagination.js'

test.describe('Events feed', () => {
  test('shows a Published event and hides an Archived one', async ({ page, context }) => {
    await signInAsAdmin(context)
    const published = await createEventViaApi(page.request, 'feed-published', { status: 'Published' })
    const archived = await createEventViaApi(page.request, 'feed-archived', { status: 'Archived' })

    await signInAsRegularUser(context, 'events-feed')
    await widenFeedPageSize(page, '/api/events')

    const listResponse = page.waitForResponse(
      (response) => response.url().includes('/api/events?') && response.request().method() === 'GET',
    )
    await page.goto('/events')
    const response = await listResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 loading the events feed, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('link', { name: published.title, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: archived.title, exact: true })).not.toBeVisible()
  })

  test('a direct visit to an archived event detail URL does not render it', async ({ page, context }) => {
    await signInAsAdmin(context)
    const archived = await createEventViaApi(page.request, 'detail-hidden', { status: 'Archived' })

    await signInAsRegularUser(context, 'events-detail-hidden')

    const detailResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/events/${archived.id}`) && response.request().method() === 'GET',
    )
    await page.goto(`/events/${archived.id}`)
    const response = await detailResponse
    expect(response.status()).toBe(404)

    await expect(page.getByRole('alert')).toContainText('Event not found')
    await expect(page.getByRole('heading', { name: archived.title, exact: true, level: 1 })).not.toBeVisible()
  })
})

test.describe('Event detail', () => {
  test('clicking a card in the feed opens the detail page', async ({ page, context }) => {
    await signInAsAdmin(context)
    const event = await createEventViaApi(page.request, 'detail')

    await signInAsRegularUser(context, 'events-detail')
    await widenFeedPageSize(page, '/api/events')
    await page.goto('/events')

    await page.getByRole('link', { name: event.title, exact: true }).click()

    await page.waitForURL(`/events/${event.id}`)
    await expect(page.getByRole('heading', { name: event.title, exact: true, level: 1 })).toBeVisible()
  })
})
