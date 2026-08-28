import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { getSeedAdminId, signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { uniqueUser } from '../fixtures/user-data.js'
import type { UniqueUser } from '../fixtures/user-data.js'
import { withDb } from '../fixtures/db.js'
import { createLookupViaApi, uniqueLookupName } from '../fixtures/lookups.js'
import { testEnv } from '../test-env.js'

interface UserFormLookups {
  departmentName: string
  designationName: string
  locationName: string
}

async function ensureUserFormLookups(page: Page): Promise<UserFormLookups> {
  const departmentName = uniqueLookupName('Department')
  const designationName = uniqueLookupName('Designation')
  const locationName = uniqueLookupName('Location')

  await createLookupViaApi(page.request, 'Department', departmentName)
  await createLookupViaApi(page.request, 'Designation', designationName)
  await createLookupViaApi(page.request, 'Location', locationName)

  return { departmentName, designationName, locationName }
}

async function findUserIdByEmail(email: string): Promise<string> {
  return withDb(async (client) => {
    const result = await client.query<{ id: string }>('select id from "user" where email = $1', [email])
    const id = result.rows[0]?.id
    if (!id) {
      throw new Error(`Created user ${email} was not found in intranet_test after creation`)
    }
    return id
  })
}

async function createUserThroughUi(page: Page, user: UniqueUser, lookups: UserFormLookups): Promise<{ id: string }> {
  await page.getByRole('button', { name: 'Create User' }).click()

  const dialog = page.getByRole('dialog', { name: 'Create User' })
  await dialog.getByLabel('Name').fill(user.name)
  await dialog.getByLabel('Email').fill(user.email)
  await dialog.getByLabel('Role').click()
  await page.getByRole('option', { name: 'User' }).click()
  await dialog.getByLabel('Employee ID').fill(user.employeeId)

  await dialog.getByLabel('Department').click()
  await page.getByRole('option', { name: lookups.departmentName, exact: true }).click()

  await dialog.getByLabel('Designation').click()
  await page.getByRole('option', { name: lookups.designationName, exact: true }).click()

  await dialog.getByLabel('Location').click()
  await page.getByRole('option', { name: lookups.locationName, exact: true }).click()

  await dialog.getByRole('combobox', { name: 'Reported To' }).click()
  await page.getByPlaceholder('Search users...').fill(testEnv.SEED_ADMIN_NAME)
  await page.getByRole('option', { name: testEnv.SEED_ADMIN_NAME, exact: true }).click()

  await dialog.getByRole('button', { name: 'Pick a date' }).first().click()
  await page.getByRole('button', { name: /^Today,/ }).last().click()

  await dialog.getByRole('button', { name: 'Pick a date' }).first().click()
  await page.getByRole('button', { name: /^Today,/ }).last().click()

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/users') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Create User' }).click()
  const response = await createResponse
  if (response.status() !== 201) {
    throw new Error(
      `Expected 201 creating user ${user.email}, got ${response.status()}: ${await response.text()}`,
    )
  }

  await expect(dialog).not.toBeVisible()

  const id = await findUserIdByEmail(user.email)
  return { id }
}

function formatJoinedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function searchAndGetRow(page: Page, query: string) {
  await page.getByPlaceholder('Search by name, email, or employee ID...').fill(query)
  return page.getByRole('row').filter({ hasText: query })
}

async function switchTab(page: Page, tabName: 'Active' | 'Inactive'): Promise<void> {
  const listResponse = page.waitForResponse(
    (response) => response.url().includes('/api/users?') && response.request().method() === 'GET',
  )
  await page.getByRole('tab', { name: tabName, exact: true }).click()
  const response = await listResponse
  if (response.status() !== 200) {
    throw new Error(`Expected 200 switching to the ${tabName} tab, got ${response.status()}: ${await response.text()}`)
  }
}

test.describe('View Users', () => {
  test('renders the seeded admin fetched from the real API', async ({ page }) => {
    await signInAsAdmin(page.context())

    const usersResponse = page.waitForResponse(
      (response) => response.url().includes('/api/users') && response.request().method() === 'GET',
    )
    await page.goto('/admin/users')
    const response = await usersResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 loading users, got ${response.status()}: ${await response.text()}`)
    }

    const body = await response.json()
    expect(Array.isArray(body.users)).toBe(true)

    const row = await searchAndGetRow(page, testEnv.SEED_ADMIN_EMAIL)
    await expect(row).toBeVisible()
    await expect(row.getByText(testEnv.SEED_ADMIN_NAME, { exact: true })).toBeVisible()
    await expect(row.getByRole('cell', { name: 'Admin', exact: true })).toBeVisible()
  })
})

test.describe('Create User', () => {
  test('creates a user through the real API and shows it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/users')

    const lookups = await ensureUserFormLookups(page)
    const user = uniqueUser('create')
    await createUserThroughUi(page, user, lookups)

    const row = await searchAndGetRow(page, user.employeeId)
    await expect(row).toBeVisible()
    await expect(row.getByText(user.name, { exact: true })).toBeVisible()
    await expect(row.getByText(user.email, { exact: true })).toBeVisible()
    await expect(row.getByRole('cell', { name: lookups.locationName, exact: true })).toBeVisible()
    await expect(
      row.getByRole('cell', { name: formatJoinedDate(new Date()), exact: true }),
    ).toBeVisible()
  })
})

test.describe('Edit User', () => {
  test('updates the name through the real API and reflects it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/users')

    const lookups = await ensureUserFormLookups(page)
    const user = uniqueUser('edit')
    await createUserThroughUi(page, user, lookups)

    const row = await searchAndGetRow(page, user.employeeId)
    await row.getByRole('checkbox', { name: `Select ${user.name}` }).check()
    await page.getByRole('button', { name: 'Edit' }).click()

    const dialog = page.getByRole('dialog', { name: 'Edit User' })
    await expect(dialog.getByLabel('Name')).toHaveValue(user.name)

    const updatedName = `${user.name} Updated`
    await dialog.getByLabel('Name').fill(updatedName)

    const updateResponse = page.waitForResponse(
      (response) => response.url().includes('/api/users') && response.request().method() === 'PUT',
    )
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating user ${user.email}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog).not.toBeVisible()
    await expect(row.getByText(updatedName, { exact: true })).toBeVisible()
    await expect(row.getByText(user.name, { exact: true })).not.toBeVisible()
  })
})

test.describe('Deactivate User', () => {
  test('deactivates a non-admin user through the real API and moves it to the Inactive tab', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/users')

    const lookups = await ensureUserFormLookups(page)
    const user = uniqueUser('deactivate')
    await createUserThroughUi(page, user, lookups)

    const row = await searchAndGetRow(page, user.employeeId)
    await row.getByRole('checkbox', { name: `Select ${user.name}` }).check()
    await page.getByRole('button', { name: 'Deactivate' }).click()

    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: `Deactivate 1 user: ${user.name}?` })).toBeVisible()

    const deactivateResponse = page.waitForResponse(
      (response) => response.url().endsWith('/users/deactivate') && response.request().method() === 'PATCH',
    )
    await alertDialog.getByRole('button', { name: 'Deactivate' }).click()
    const response = await deactivateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deactivating user ${user.email}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(alertDialog).not.toBeVisible()
    await expect(row).not.toBeVisible()

    await switchTab(page, 'Inactive')
    const inactiveRow = await searchAndGetRow(page, user.employeeId)
    await expect(inactiveRow).toBeVisible()
    await expect(inactiveRow.getByText(user.name, { exact: true })).toBeVisible()
  })
})

test.describe('Reactivate User', () => {
  test('reactivates a user through the real API and moves it back to the Active tab', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/users')

    const lookups = await ensureUserFormLookups(page)
    const user = uniqueUser('reactivate')
    const created = await createUserThroughUi(page, user, lookups)

    const setupResponse = await page.request.patch('/api/users/deactivate', { data: { ids: [created.id] } })
    if (setupResponse.status() !== 200) {
      throw new Error(
        `Setup failed deactivating user ${user.email} before the reactivate test, got ${setupResponse.status()}: ${await setupResponse.text()}`,
      )
    }

    await switchTab(page, 'Inactive')
    const inactiveRow = await searchAndGetRow(page, user.employeeId)
    await expect(inactiveRow).toBeVisible()
    await inactiveRow.getByRole('checkbox', { name: `Select ${user.name}` }).check()

    const reactivateResponse = page.waitForResponse(
      (response) => response.url().endsWith('/users/reactivate') && response.request().method() === 'PATCH',
    )
    await page.getByRole('button', { name: 'Reactivate' }).click()
    const response = await reactivateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 reactivating user ${user.email}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(inactiveRow).not.toBeVisible()

    await switchTab(page, 'Active')
    const activeRow = await searchAndGetRow(page, user.employeeId)
    await expect(activeRow).toBeVisible()
  })
})

test.describe('Admin Protection', () => {
  test('a request to deactivate an Admin is rejected with 403 and the admin stays on the Active tab', async ({ page }) => {
    await signInAsAdmin(page.context())

    const adminId = await getSeedAdminId()

    const response = await page.request.patch('/api/users/deactivate', { data: { ids: [adminId] } })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe(`Admin users cannot be deactivated: ${testEnv.SEED_ADMIN_NAME}`)

    await page.goto('/admin/users')
    const row = await searchAndGetRow(page, testEnv.SEED_ADMIN_EMAIL)
    await expect(row).toBeVisible()
    await expect(row.getByRole('cell', { name: 'Admin', exact: true })).toBeVisible()
  })
})

test.describe('Deactivation revokes existing sessions', () => {
  test('a forged session for a user stops authenticating on the very next request after an admin deactivates them (proves session.deleteMany revocation, not the sign-in hook, which forged sessions bypass)', async ({
    page,
    browser,
  }) => {
    const user = await signInAsRegularUser(page.context(), 'revoke')

    const meResponse = await page.request.get('/api/me')
    if (meResponse.status() !== 200) {
      throw new Error(`Expected 200 loading /api/me before deactivation, got ${meResponse.status()}: ${await meResponse.text()}`)
    }
    const me: { email: string } = await meResponse.json()
    expect(me.email).toBe(user.email)

    const adminContext = await browser.newContext({ baseURL: testEnv.CLIENT_URL })
    await signInAsAdmin(adminContext)

    const deactivateResponse = await adminContext.request.patch('/api/users/deactivate', {
      data: { ids: [user.id] },
    })
    if (deactivateResponse.status() !== 200) {
      throw new Error(
        `Expected 200 deactivating user ${user.email}, got ${deactivateResponse.status()}: ${await deactivateResponse.text()}`,
      )
    }
    const body: { message: string } = await deactivateResponse.json()
    expect(body.message).toBe('1 user deactivated successfully')

    await adminContext.close()

    const meAfterDeactivation = await page.request.get('/api/me')
    expect(meAfterDeactivation.status()).toBe(401)
  })
})
