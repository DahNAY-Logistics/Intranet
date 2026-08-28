import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

import { getSeedAdminId, signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { createLookupViaApi, lookupBasePath, uniqueLookupName } from '../fixtures/lookups.js'
import type { LookupKind } from '../fixtures/lookups.js'
import { uniqueUser } from '../fixtures/user-data.js'

interface Manager {
  kind: LookupKind
  buttonName: 'Departments' | 'Designations' | 'Locations'
}

const managers: Manager[] = [
  { kind: 'Department', buttonName: 'Departments' },
  { kind: 'Designation', buttonName: 'Designations' },
  { kind: 'Location', buttonName: 'Locations' },
]

async function openManager(page: Page, buttonName: Manager['buttonName']): Promise<Locator> {
  await page.getByRole('button', { name: buttonName }).click()
  return page.getByRole('dialog', { name: buttonName })
}

interface ReferencedLookupTarget {
  kind: LookupKind
  id: number
}

async function createValidUserViaApi(page: Page, target: ReferencedLookupTarget): Promise<void> {
  const user = uniqueUser('lookup-in-use')
  const managerId = await getSeedAdminId()

  const [departmentId, designationId, locationId] = await Promise.all([
    target.kind === 'Department' ? target.id : createLookupViaApi(page.request, 'Department', uniqueLookupName('Department')),
    target.kind === 'Designation' ? target.id : createLookupViaApi(page.request, 'Designation', uniqueLookupName('Designation')),
    target.kind === 'Location' ? target.id : createLookupViaApi(page.request, 'Location', uniqueLookupName('Location')),
  ])

  const response = await page.request.post('/api/users', {
    data: {
      name: user.name,
      email: user.email,
      role: 'User',
      employeeId: user.employeeId,
      departmentId,
      designationId,
      locationId,
      dob: '1990-01-01T00:00:00.000Z',
      joinedDate: '2024-01-01T00:00:00.000Z',
      reportedToId: managerId,
    },
  })
  if (response.status() !== 201) {
    throw new Error(`Expected 201 creating a user referencing a lookup, got ${response.status()}: ${await response.text()}`)
  }
}

test.describe('Navigate to lookup managers', () => {
  for (const manager of managers) {
    test(`an admin opens the ${manager.buttonName} manager from the Users page header`, async ({ page }) => {
      await signInAsAdmin(page.context())
      await page.goto('/admin/users')

      const dialog = await openManager(page, manager.buttonName)
      await expect(dialog.getByRole('heading', { name: manager.buttonName })).toBeVisible()
      await expect(dialog.getByPlaceholder(`New ${manager.kind.toLowerCase()} name`)).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    })
  }
})

for (const manager of managers) {
  test.describe(`${manager.kind} manager`, () => {
    test.describe(`Create ${manager.kind}`, () => {
      test(`creates a ${manager.kind.toLowerCase()} through the real API and shows it in the manager list`, async ({ page }) => {
        await signInAsAdmin(page.context())
        await page.goto('/admin/users')

        const name = uniqueLookupName(manager.kind)
        const dialog = await openManager(page, manager.buttonName)
        const nameInput = dialog.getByPlaceholder(`New ${manager.kind.toLowerCase()} name`)
        await nameInput.fill(name)

        const createResponse = page.waitForResponse(
          (response) => response.url().endsWith(lookupBasePath(manager.kind)) && response.request().method() === 'POST',
        )
        await nameInput.press('Enter')
        const response = await createResponse
        if (response.status() !== 201) {
          throw new Error(`Expected 201 creating ${manager.kind} ${name}, got ${response.status()}: ${await response.text()}`)
        }

        await expect(dialog.getByText(name, { exact: true })).toBeVisible()
      })
    })

    test.describe(`Rename ${manager.kind}`, () => {
      test(`renames a ${manager.kind.toLowerCase()} through the real API and reflects it in the manager list`, async ({ page }) => {
        await signInAsAdmin(page.context())
        await page.goto('/admin/users')

        const originalName = uniqueLookupName(manager.kind)
        const id = await createLookupViaApi(page.request, manager.kind, originalName)
        const updatedName = uniqueLookupName(manager.kind)

        const renameResponse = await page.request.put(`${lookupBasePath(manager.kind)}/${id}`, {
          data: { name: updatedName },
        })
        if (renameResponse.status() !== 200) {
          throw new Error(`Expected 200 renaming ${manager.kind} ${id}, got ${renameResponse.status()}: ${await renameResponse.text()}`)
        }

        const dialog = await openManager(page, manager.buttonName)
        await expect(dialog.getByText(updatedName, { exact: true })).toBeVisible()
        await expect(dialog.getByText(originalName, { exact: true })).not.toBeVisible()
      })
    })

    test.describe(`Delete ${manager.kind}`, () => {
      test(`deletes an unused ${manager.kind.toLowerCase()} through the real API and removes it from the manager list`, async ({ page }) => {
        await signInAsAdmin(page.context())
        await page.goto('/admin/users')

        const name = uniqueLookupName(manager.kind)
        const id = await createLookupViaApi(page.request, manager.kind, name)

        const deleteResponse = await page.request.delete(`${lookupBasePath(manager.kind)}/${id}`)
        if (deleteResponse.status() !== 200) {
          throw new Error(`Expected 200 deleting ${manager.kind} ${id}, got ${deleteResponse.status()}: ${await deleteResponse.text()}`)
        }

        const dialog = await openManager(page, manager.buttonName)
        await expect(dialog.getByText(name, { exact: true })).not.toBeVisible()
      })

      test(`is rejected with a 400 while a user references it, and it stays in the manager list`, async ({ page }) => {
        await signInAsAdmin(page.context())
        await page.goto('/admin/users')

        const name = uniqueLookupName(manager.kind)
        const id = await createLookupViaApi(page.request, manager.kind, name)
        await createValidUserViaApi(page, { kind: manager.kind, id })

        const deleteResponse = await page.request.delete(`${lookupBasePath(manager.kind)}/${id}`)

        expect(deleteResponse.status()).toBe(400)
        const body: { error: string } = await deleteResponse.json()
        expect(body.error).toBe(`Cannot delete ${manager.kind.toLowerCase()}: 1 user still use it.`)

        const dialog = await openManager(page, manager.buttonName)
        await expect(dialog.getByText(name, { exact: true })).toBeVisible()
      })
    })
  })
}

test.describe('Authorization', () => {
  for (const manager of managers) {
    test(`a non-admin gets 403 creating a ${manager.kind.toLowerCase()}`, async ({ page }) => {
      await signInAsRegularUser(page.context(), `create-${manager.kind.toLowerCase()}`)

      const response = await page.request.post(lookupBasePath(manager.kind), {
        data: { name: uniqueLookupName(manager.kind) },
      })

      expect(response.status()).toBe(403)
      const body: { error: string } = await response.json()
      expect(body.error).toBe('Forbidden')
    })

    test(`a non-admin gets 403 deleting a ${manager.kind.toLowerCase()}`, async ({ page }) => {
      await signInAsRegularUser(page.context(), `delete-${manager.kind.toLowerCase()}`)

      const response = await page.request.delete(`${lookupBasePath(manager.kind)}/1`)

      expect(response.status()).toBe(403)
      const body: { error: string } = await response.json()
      expect(body.error).toBe('Forbidden')
    })
  }
})
