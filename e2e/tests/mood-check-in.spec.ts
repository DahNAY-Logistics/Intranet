import { expect, test } from '@playwright/test'

import { signInAsRegularUser } from '../fixtures/regular-user-session.js'

test.describe('Mood check-in', () => {
  test('auto-opens for a signed-in employee who has not checked in today', async ({ page, context }) => {
    await signInAsRegularUser(context, 'mood-open')

    const statusResponse = page.waitForResponse(
      (response) => response.url().includes('/api/mood-check-ins/status') && response.request().method() === 'GET',
    )
    await page.goto('/home')
    await statusResponse

    await expect(page.getByText('How are you feeling today?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Very Happy', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Happy', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Neutral', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sad', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Very Sad', exact: true })).toBeVisible()
  })

  test('persists the submitted check-in through a reload so the modal does not reopen', async ({ page, context }) => {
    await signInAsRegularUser(context, 'mood-persist')

    const firstStatusResponse = page.waitForResponse(
      (response) => response.url().includes('/api/mood-check-ins/status') && response.request().method() === 'GET',
    )
    await page.goto('/home')
    await firstStatusResponse

    await expect(page.getByRole('button', { name: 'Happy', exact: true })).toBeVisible()

    const submitResponse = page.waitForResponse(
      (response) => response.url().includes('/api/mood-check-ins') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Happy', exact: true }).click()
    const submitted = await submitResponse
    if (submitted.status() !== 201) {
      throw new Error(`Expected 201 submitting mood check-in, got ${submitted.status()}: ${await submitted.text()}`)
    }

    await expect(page.getByText('Thanks for checking in!')).toBeVisible()

    const reloadStatusResponse = page.waitForResponse(
      (response) => response.url().includes('/api/mood-check-ins/status') && response.request().method() === 'GET',
    )
    await page.reload()
    const reloadStatus = await reloadStatusResponse
    const body = (await reloadStatus.json()) as { checkedIn: boolean }
    expect(body.checkedIn).toBe(true)

    await expect(page.getByText('How are you feeling today?')).not.toBeVisible()
  })
})
