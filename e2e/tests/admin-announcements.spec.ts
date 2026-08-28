import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { uniqueAnnouncementCategoryName, uniqueAnnouncementTitle } from '../fixtures/announcement-data.js'
import { listRowActionButtons, listRowByTitle } from '../fixtures/list-row.js'

interface CreatedAnnouncement {
  id: number
  title: string
  excerpt: string
  status: string
  category: { id: number; name: string }
  postedBy: { name: string }
}

interface AnnouncementsListResponse {
  announcements: CreatedAnnouncement[]
}

async function createCategoryThroughUi(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Categories' }).click()
  const dialog = page.getByRole('dialog', { name: 'Categories' })

  const nameInput = dialog.getByPlaceholder('New category name')
  await nameInput.fill(name)

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/announcements/categories') && response.request().method() === 'POST',
  )
  await nameInput.press('Enter')
  const response = await createResponse
  if (response.status() !== 201) {
    throw new Error(`Expected 201 creating category ${name}, got ${response.status()}: ${await response.text()}`)
  }

  await expect(dialog.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 })
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
}

async function createAnnouncementThroughUi(
  page: Page,
  { title, categoryName, status = 'Published' }: { title: string; categoryName: string; status?: 'Published' | 'Archived' },
): Promise<CreatedAnnouncement> {
  await page.getByRole('button', { name: 'Create Announcement', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Create Announcement' })

  await dialog.getByLabel('Title').fill(title)
  await dialog.getByLabel('Excerpt').fill('Created by the Playwright e2e suite.')

  await dialog.getByLabel('Category').click()
  await page.getByRole('option', { name: categoryName, exact: true }).click()

  await dialog.getByLabel('Status').click()
  await page.getByRole('option', { name: status, exact: true }).click()

  const listResponse = page.waitForResponse(
    (response) => response.url().includes('/api/announcements?') && response.request().method() === 'GET',
  )
  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/announcements') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Create Announcement', exact: true }).click()
  const created = await createResponse
  if (created.status() !== 201) {
    throw new Error(`Expected 201 creating announcement ${title}, got ${created.status()}: ${await created.text()}`)
  }

  await expect(dialog).not.toBeVisible()

  const list = await listResponse
  if (list.status() !== 200) {
    throw new Error(`Expected 200 refreshing announcements after creating ${title}, got ${list.status()}: ${await list.text()}`)
  }
  const body: AnnouncementsListResponse = await list.json()
  const announcement = body.announcements.find((candidate) => candidate.title === title)
  if (!announcement) {
    throw new Error(`Announcement "${title}" was not found in the announcements list response after creation.`)
  }
  return announcement
}

async function waitForOptionalAnnouncementsRefetch(page: Page) {
  return page
    .waitForResponse((response) => response.url().includes('/api/announcements?') && response.request().method() === 'GET', {
      timeout: 5000,
    })
    .catch(() => null)
}

async function toggleCategoryFilterOption(page: Page, categoryName: string): Promise<void> {
  await page.getByRole('button', { name: 'Category' }).click()
  await page.getByPlaceholder('Category').fill(categoryName)

  const listResponse = waitForOptionalAnnouncementsRefetch(page)
  await page.getByRole('option', { name: categoryName }).click()
  const response = await listResponse
  if (response && response.status() !== 200) {
    throw new Error(`Expected 200 filtering announcements by category ${categoryName}, got ${response.status()}: ${await response.text()}`)
  }
  await page.keyboard.press('Escape')
}

async function toggleStatusFilterOption(page: Page, status: 'Published' | 'Archived'): Promise<void> {
  await page.getByRole('button', { name: 'Status' }).click()

  const listResponse = waitForOptionalAnnouncementsRefetch(page)
  await page.getByRole('option', { name: status }).click()
  const response = await listResponse
  if (response && response.status() !== 200) {
    throw new Error(`Expected 200 filtering announcements by status ${status}, got ${response.status()}: ${await response.text()}`)
  }
  await page.keyboard.press('Escape')
}

function getCardActionButtons(page: Page, title: string) {
  return listRowActionButtons(listRowByTitle(page, title))
}

test.describe('Navigate to Announcements', () => {
  test('an admin reaches the announcements page from the sidebar', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin')

    await page.getByRole('link', { name: 'Announcements' }).click()

    await page.waitForURL('/admin/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Announcement', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible()
  })
})

test.describe('Create Category', () => {
  test('creates a category through the real API and shows it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    await createCategoryThroughUi(page, uniqueAnnouncementCategoryName('create'))
  })
})

test.describe('Create Announcement', () => {
  test('creates an announcement through the real API and shows it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    const categoryName = uniqueAnnouncementCategoryName('create-announcement')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueAnnouncementTitle('create')
    const announcement = await createAnnouncementThroughUi(page, { title, categoryName })

    expect(announcement.title).toBe(title)
    expect(announcement.status).toBe('Published')

    await toggleCategoryFilterOption(page, categoryName)
    await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible()
  })
})

test.describe('Edit Announcement', () => {
  test('renames an announcement through the real API and reflects it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    const categoryName = uniqueAnnouncementCategoryName('edit')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueAnnouncementTitle('edit')
    const announcement = await createAnnouncementThroughUi(page, { title, categoryName })

    await toggleCategoryFilterOption(page, categoryName)

    const { editButton } = await getCardActionButtons(page, title)

    const loadResponse = page.waitForResponse(
      (response) => response.url().includes(`/announcements/${announcement.id}`) && response.request().method() === 'GET',
    )
    await editButton.click()
    const loadResult = await loadResponse
    if (loadResult.status() !== 200) {
      throw new Error(`Expected 200 loading announcement ${announcement.id}, got ${loadResult.status()}: ${await loadResult.text()}`)
    }

    const dialog = page.getByRole('dialog', { name: 'Edit Announcement' })
    await expect(dialog.getByLabel('Title')).toHaveValue(title)

    const updatedTitle = `${title} Updated`
    await dialog.getByLabel('Title').fill(updatedTitle)

    const updateResponse = page.waitForResponse(
      (response) => response.url().includes(`/announcements/${announcement.id}`) && response.request().method() === 'PUT',
    )
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating announcement ${announcement.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('link', { name: updatedTitle, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: title, exact: true })).not.toBeVisible()
  })
})

test.describe('Delete Announcement', () => {
  test('removes an announcement through the real API', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    const categoryName = uniqueAnnouncementCategoryName('delete')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueAnnouncementTitle('delete')
    const announcement = await createAnnouncementThroughUi(page, { title, categoryName })

    await toggleCategoryFilterOption(page, categoryName)

    const { deleteButton } = await getCardActionButtons(page, title)
    await deleteButton.click()

    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: `Delete "${title}"?` })).toBeVisible()

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes(`/announcements/${announcement.id}`) && response.request().method() === 'DELETE',
    )
    await alertDialog.getByRole('button', { name: 'Delete' }).click()
    const response = await deleteResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deleting announcement ${announcement.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('link', { name: title, exact: true })).not.toBeVisible()
  })
})

test.describe('Filter by Status', () => {
  test('narrows the list to the selected status', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    const categoryName = uniqueAnnouncementCategoryName('filter-status')
    await createCategoryThroughUi(page, categoryName)

    const publishedTitle = uniqueAnnouncementTitle('filter-status-published')
    await createAnnouncementThroughUi(page, { title: publishedTitle, categoryName, status: 'Published' })

    const archivedTitle = uniqueAnnouncementTitle('filter-status-archived')
    await createAnnouncementThroughUi(page, { title: archivedTitle, categoryName, status: 'Archived' })

    await toggleCategoryFilterOption(page, categoryName)
    await expect(page.getByRole('link', { name: publishedTitle, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: archivedTitle, exact: true })).toBeVisible()

    await toggleStatusFilterOption(page, 'Archived')
    await expect(page.getByRole('link', { name: archivedTitle, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: publishedTitle, exact: true })).not.toBeVisible()

    await toggleStatusFilterOption(page, 'Archived')
    await toggleStatusFilterOption(page, 'Published')
    await expect(page.getByRole('link', { name: publishedTitle, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: archivedTitle, exact: true })).not.toBeVisible()
  })
})

test.describe('Filter by Category', () => {
  test('narrows the list to the selected category', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    const categoryNameA = uniqueAnnouncementCategoryName('filter-category-a')
    await createCategoryThroughUi(page, categoryNameA)
    const titleA = uniqueAnnouncementTitle('filter-category-a')
    await createAnnouncementThroughUi(page, { title: titleA, categoryName: categoryNameA })

    const categoryNameB = uniqueAnnouncementCategoryName('filter-category-b')
    await createCategoryThroughUi(page, categoryNameB)
    const titleB = uniqueAnnouncementTitle('filter-category-b')
    await createAnnouncementThroughUi(page, { title: titleB, categoryName: categoryNameB })

    await toggleCategoryFilterOption(page, categoryNameA)
    await expect(page.getByRole('link', { name: titleA, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: titleB, exact: true })).not.toBeVisible()

    await toggleCategoryFilterOption(page, categoryNameA)
    await toggleCategoryFilterOption(page, categoryNameB)
    await expect(page.getByRole('link', { name: titleB, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: titleA, exact: true })).not.toBeVisible()
  })
})

test.describe('Sort order toggle', () => {
  test('flips the list between newest first and oldest first', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    const categoryName = uniqueAnnouncementCategoryName('sort-order')
    await createCategoryThroughUi(page, categoryName)

    const firstTitle = uniqueAnnouncementTitle('sort-order-first')
    await createAnnouncementThroughUi(page, { title: firstTitle, categoryName })

    const secondTitle = uniqueAnnouncementTitle('sort-order-second')
    await createAnnouncementThroughUi(page, { title: secondTitle, categoryName })

    await toggleCategoryFilterOption(page, categoryName)

    await expect(page.getByRole('button', { name: 'Newest first', exact: true })).toBeVisible()
    const defaultOrder = await page.getByRole('article').getByRole('link').allTextContents()
    expect(defaultOrder.indexOf(secondTitle)).toBeLessThan(defaultOrder.indexOf(firstTitle))

    const sortResponse = page.waitForResponse(
      (response) => response.url().includes('/api/announcements?') && response.request().method() === 'GET',
    )
    await page.getByRole('button', { name: 'Newest first', exact: true }).click()
    const response = await sortResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 sorting announcements, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('button', { name: 'Oldest first', exact: true })).toBeVisible()
    const flippedOrder = await page.getByRole('article').getByRole('link').allTextContents()
    expect(flippedOrder.indexOf(firstTitle)).toBeLessThan(flippedOrder.indexOf(secondTitle))
  })
})

test.describe('Navigate to detail page', () => {
  test('clicking a title opens the detail page and Back returns to the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/announcements')

    const categoryName = uniqueAnnouncementCategoryName('detail')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueAnnouncementTitle('detail')
    const announcement = await createAnnouncementThroughUi(page, { title, categoryName })

    await toggleCategoryFilterOption(page, categoryName)

    await page.getByRole('link', { name: title, exact: true }).click()

    await page.waitForURL(`/admin/announcements/${announcement.id}`)
    await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible()
    await expect(page.getByText(categoryName, { exact: true })).toBeVisible()
    await expect(page.getByText(`Posted by ${announcement.postedBy.name}`, { exact: true })).toBeVisible()
    await expect(page.getByText(announcement.excerpt, { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Back' }).click()
    await page.waitForURL('/admin/announcements')
  })
})

test.describe('Authorization', () => {
  test('a non-admin gets 403 creating an announcement', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-announcement')

    const response = await page.request.post('/api/announcements', {
      data: { title: 'Forbidden', excerpt: 'Forbidden', categoryId: 'nonexistent-category', status: 'Published' },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating an announcement', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-announcement')

    const response = await page.request.put('/api/announcements/nonexistent-id', {
      data: { title: 'Forbidden', excerpt: 'Forbidden', categoryId: 'nonexistent-category', status: 'Published' },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting an announcement', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-announcement')

    const response = await page.request.delete('/api/announcements/nonexistent-id')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 creating a category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-category')

    const response = await page.request.post('/api/announcements/categories', {
      data: { name: uniqueAnnouncementCategoryName('forbidden') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating a category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-category')

    const response = await page.request.put('/api/announcements/categories/nonexistent-id', {
      data: { name: uniqueAnnouncementCategoryName('forbidden-update') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting a category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-category')

    const response = await page.request.delete('/api/announcements/categories/nonexistent-id')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })
})
