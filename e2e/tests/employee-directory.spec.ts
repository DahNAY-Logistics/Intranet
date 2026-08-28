import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { createLookupViaApi, uniqueLookupName } from '../fixtures/lookups.js'
import { createUserViaApi } from '../fixtures/user-data.js'

test.describe('Directory feed', () => {
  test('lists seeded staff and narrows the list with a department filter', async ({ page, context }) => {
    await signInAsAdmin(context)

    const designationId = await createLookupViaApi(page.request, 'Designation', uniqueLookupName('Designation'))
    const locationId = await createLookupViaApi(page.request, 'Location', uniqueLookupName('Location'))

    const departmentAName = uniqueLookupName('Department')
    const departmentAId = await createLookupViaApi(page.request, 'Department', departmentAName)
    const departmentBId = await createLookupViaApi(page.request, 'Department', uniqueLookupName('Department'))

    const runToken = randomUUID().slice(0, 8)
    const userA = await createUserViaApi(page.request, `directory-${runToken}-a`, {
      departmentId: departmentAId,
      designationId,
      locationId,
    })
    const userB = await createUserViaApi(page.request, `directory-${runToken}-b`, {
      departmentId: departmentBId,
      designationId,
      locationId,
    })

    await signInAsRegularUser(context, 'directory-view')
    await page.goto('/directory')

    const searchResponse = page.waitForResponse(
      (response) => response.url().includes('/api/directory?') && response.request().method() === 'GET',
    )
    await page.getByPlaceholder('Search by name, email, or employee ID...').fill(`directory-${runToken}`)
    const searched = await searchResponse
    if (searched.status() !== 200) {
      throw new Error(`Expected 200 searching the directory, got ${searched.status()}: ${await searched.text()}`)
    }

    await expect(page.getByRole('heading', { name: userA.name, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: userB.name, exact: true, level: 3 })).toBeVisible()

    await page.getByRole('button', { name: 'Department' }).click()
    await page.getByPlaceholder('Department').fill(departmentAName)

    const filterResponse = page.waitForResponse(
      (filtered) => filtered.url().includes('/api/directory?') && filtered.request().method() === 'GET',
    )
    await page.getByRole('option', { name: departmentAName }).click()
    const filtered = await filterResponse
    if (filtered.status() !== 200) {
      throw new Error(`Expected 200 filtering the directory by department, got ${filtered.status()}: ${await filtered.text()}`)
    }
    await page.keyboard.press('Escape')

    await expect(page.getByRole('heading', { name: userA.name, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: userB.name, exact: true, level: 3 })).not.toBeVisible()
  })
})
