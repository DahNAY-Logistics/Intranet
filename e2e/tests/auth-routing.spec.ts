import { expect, test } from '@playwright/test'

import { signInAsRegularUser } from '../fixtures/regular-user-session.js'

test.describe('Unauthenticated routing', () => {
  test('renders the login page at the root', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /Every route/, level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('redirects an unauthenticated visit to /home back to the login page', async ({ page }) => {
    await page.goto('/home')

    await page.waitForURL('/')
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('redirects an unauthenticated visit to /admin back to the login page', async ({ page }) => {
    await page.goto('/admin')

    await page.waitForURL('/')
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('shows the fixed access-denied message for any callback error', async ({ page }) => {
    await page.goto('/?error=access_denied')

    await expect(page.getByRole('alert')).toHaveText(
      'Access denied. Contact your administrator if you believe this is a mistake.',
    )
  })
})

test.describe('Signed-in root redirect', () => {
  test('redirects a signed-in employee from / to /home', async ({ page, context }) => {
    await signInAsRegularUser(context, 'root-redirect')

    await page.goto('/')

    await page.waitForURL('/home')
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByText(/Hola/)).toBeVisible()
  })
})
