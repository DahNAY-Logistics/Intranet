import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { uniqueQuickLinkCategoryName, uniqueQuickLinkTitle, uniqueQuickLinkUrl } from '../fixtures/quick-link-data.js'
import { listRowActionButtons, listRowByTitle } from '../fixtures/list-row.js'

interface CreatedQuickLink {
  id: number
  title: string
  excerpt: string
  url: string
  status: string
  category: { id: number; name: string }
  postedBy: { name: string }
}

interface QuickLinksListResponse {
  quickLinks: CreatedQuickLink[]
}

async function createCategoryThroughUi(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Categories' }).click()
  const dialog = page.getByRole('dialog', { name: 'Categories' })

  const nameInput = dialog.getByPlaceholder('New category name')
  await nameInput.fill(name)

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/quick-links/categories') && response.request().method() === 'POST',
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

async function createQuickLinkThroughUi(
  page: Page,
  {
    title,
    categoryName,
    url = uniqueQuickLinkUrl('create'),
    status = 'Published',
  }: { title: string; categoryName: string; url?: string; status?: 'Published' | 'Archived' },
): Promise<CreatedQuickLink> {
  await page.getByRole('button', { name: 'Create Quick Link', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Create Quick Link' })

  await dialog.getByLabel('Title').fill(title)
  await dialog.getByLabel('Excerpt').fill('Created by the Playwright e2e suite.')
  await dialog.getByLabel('URL').fill(url)

  await dialog.getByLabel('Category').click()
  await page.getByRole('option', { name: categoryName, exact: true }).click()

  await dialog.getByLabel('Status').click()
  await page.getByRole('option', { name: status, exact: true }).click()

  const listResponse = page.waitForResponse(
    (response) => response.url().includes('/api/quick-links?') && response.request().method() === 'GET',
  )
  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/quick-links') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Create Quick Link', exact: true }).click()
  const created = await createResponse
  if (created.status() !== 201) {
    throw new Error(`Expected 201 creating quick link ${title}, got ${created.status()}: ${await created.text()}`)
  }

  await expect(dialog).not.toBeVisible()

  const list = await listResponse
  if (list.status() !== 200) {
    throw new Error(`Expected 200 refreshing quick links after creating ${title}, got ${list.status()}: ${await list.text()}`)
  }
  const body: QuickLinksListResponse = await list.json()
  const quickLink = body.quickLinks.find((candidate) => candidate.title === title)
  if (!quickLink) {
    throw new Error(`Quick link "${title}" was not found in the quick links list response after creation.`)
  }
  return quickLink
}

async function waitForOptionalQuickLinksRefetch(page: Page) {
  return page
    .waitForResponse((response) => response.url().includes('/api/quick-links?') && response.request().method() === 'GET', {
      timeout: 5000,
    })
    .catch(() => null)
}

async function toggleCategoryFilterOption(page: Page, categoryName: string): Promise<void> {
  await page.getByRole('button', { name: 'Category' }).click()
  await page.getByPlaceholder('Category').fill(categoryName)

  const listResponse = waitForOptionalQuickLinksRefetch(page)
  await page.getByRole('option', { name: categoryName }).click()
  const response = await listResponse
  if (response && response.status() !== 200) {
    throw new Error(`Expected 200 filtering quick links by category ${categoryName}, got ${response.status()}: ${await response.text()}`)
  }
  await page.keyboard.press('Escape')
}

async function toggleStatusFilterOption(page: Page, status: 'Published' | 'Archived'): Promise<void> {
  await page.getByRole('button', { name: 'Status' }).click()

  const listResponse = waitForOptionalQuickLinksRefetch(page)
  await page.getByRole('option', { name: status }).click()
  const response = await listResponse
  if (response && response.status() !== 200) {
    throw new Error(`Expected 200 filtering quick links by status ${status}, got ${response.status()}: ${await response.text()}`)
  }
  await page.keyboard.press('Escape')
}

function getCardActionButtons(page: Page, title: string) {
  return listRowActionButtons(listRowByTitle(page, title))
}

test.describe('Navigate to Quick Links', () => {
  test('an admin reaches the quick links page from the sidebar', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin')

    await page.getByRole('link', { name: 'Quick Links' }).click()

    await page.waitForURL('/admin/quick-links')
    await expect(page.getByRole('heading', { name: 'Quick Links', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Quick Link', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible()
  })
})

test.describe('Create Category', () => {
  test('creates a category through the real API and shows it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/quick-links')

    await createCategoryThroughUi(page, uniqueQuickLinkCategoryName('create'))
  })
})

test.describe('Create Quick Link', () => {
  test('creates a quick link through the real API and shows it in the list with the picked fields', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/quick-links')

    const categoryName = uniqueQuickLinkCategoryName('use')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueQuickLinkTitle('create')
    const url = uniqueQuickLinkUrl('create')
    const quickLink = await createQuickLinkThroughUi(page, { title, categoryName, url, status: 'Published' })

    expect(quickLink.title).toBe(title)
    expect(quickLink.status).toBe('Published')
    expect(quickLink.url).toBe(url)
    expect(quickLink.category.name).toBe(categoryName)

    const card = listRowByTitle(page, title)
    await expect(card.getByRole('heading', { name: title, exact: true, level: 3 })).toBeVisible()
    await expect(card.getByText(categoryName, { exact: true })).toBeVisible()
    await expect(card.getByText('Published', { exact: true })).toBeVisible()
    await expect(card.getByRole('link', { name: 'example.com', exact: true })).toHaveAttribute('href', url)

    const listResponse = await page.request.get('/api/quick-links', { params: { pageSize: 100 } })
    if (listResponse.status() !== 200) {
      throw new Error(`Expected 200 listing quick links, got ${listResponse.status()}: ${await listResponse.text()}`)
    }
    const listBody: QuickLinksListResponse = await listResponse.json()
    const refetched = listBody.quickLinks.find((candidate) => candidate.id === quickLink.id)
    if (!refetched) {
      throw new Error(`Quick link ${quickLink.id} was not found in a fresh GET /api/quick-links after creation.`)
    }
    expect(refetched.title).toBe(title)
    expect(refetched.status).toBe('Published')
    expect(refetched.url).toBe(url)
    expect(refetched.category.name).toBe(categoryName)
  })
})

test.describe('Edit Quick Link', () => {
  test('renames a quick link and changes its status through the real API and reflects it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/quick-links')

    const categoryName = uniqueQuickLinkCategoryName('edit')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueQuickLinkTitle('edit')
    const quickLink = await createQuickLinkThroughUi(page, { title, categoryName })

    const { editButton } = getCardActionButtons(page, title)

    const loadResponse = page.waitForResponse(
      (response) => response.url().includes(`/quick-links/${quickLink.id}`) && response.request().method() === 'GET',
    )
    await editButton.click()
    const loadResult = await loadResponse
    if (loadResult.status() !== 200) {
      throw new Error(`Expected 200 loading quick link ${quickLink.id}, got ${loadResult.status()}: ${await loadResult.text()}`)
    }

    const dialog = page.getByRole('dialog', { name: 'Edit Quick Link' })
    await expect(dialog.getByLabel('Title')).toHaveValue(title)

    const updatedTitle = `${title} Updated`
    await dialog.getByLabel('Title').fill(updatedTitle)

    await dialog.getByLabel('Status').click()
    await page.getByRole('option', { name: 'Archived', exact: true }).click()

    const updateResponse = page.waitForResponse(
      (response) => response.url().includes(`/quick-links/${quickLink.id}`) && response.request().method() === 'PUT',
    )
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating quick link ${quickLink.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('heading', { name: updatedTitle, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: title, exact: true, level: 3 })).not.toBeVisible()

    const detailResponse = await page.request.get(`/api/quick-links/${quickLink.id}`)
    if (detailResponse.status() !== 200) {
      throw new Error(`Expected 200 loading quick link ${quickLink.id} after update, got ${detailResponse.status()}: ${await detailResponse.text()}`)
    }
    const detailBody: { quickLink: CreatedQuickLink } = await detailResponse.json()
    expect(detailBody.quickLink.title).toBe(updatedTitle)
    expect(detailBody.quickLink.status).toBe('Archived')
  })
})

test.describe('Delete Quick Link', () => {
  test('removes a quick link through the real API', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/quick-links')

    const categoryName = uniqueQuickLinkCategoryName('delete')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueQuickLinkTitle('delete')
    const quickLink = await createQuickLinkThroughUi(page, { title, categoryName })

    const { deleteButton } = getCardActionButtons(page, title)
    await deleteButton.click()

    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: `Delete "${title}"?` })).toBeVisible()

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes(`/quick-links/${quickLink.id}`) && response.request().method() === 'DELETE',
    )
    await alertDialog.getByRole('button', { name: 'Delete' }).click()
    const response = await deleteResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deleting quick link ${quickLink.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('heading', { name: title, exact: true, level: 3 })).not.toBeVisible()

    const getResponse = await page.request.get(`/api/quick-links/${quickLink.id}`)
    expect(getResponse.status()).toBe(404)
  })
})

test.describe('Filter by Status', () => {
  test('narrows the list to the selected status', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/quick-links')

    const categoryName = uniqueQuickLinkCategoryName('filter-status')
    await createCategoryThroughUi(page, categoryName)

    const publishedTitle = uniqueQuickLinkTitle('filter-status-published')
    await createQuickLinkThroughUi(page, { title: publishedTitle, categoryName, status: 'Published' })

    const archivedTitle = uniqueQuickLinkTitle('filter-status-archived')
    await createQuickLinkThroughUi(page, { title: archivedTitle, categoryName, status: 'Archived' })

    await toggleCategoryFilterOption(page, categoryName)
    await expect(page.getByRole('heading', { name: publishedTitle, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: archivedTitle, exact: true, level: 3 })).toBeVisible()

    await toggleStatusFilterOption(page, 'Archived')
    await expect(page.getByRole('heading', { name: archivedTitle, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: publishedTitle, exact: true, level: 3 })).not.toBeVisible()

    await toggleStatusFilterOption(page, 'Archived')
    await toggleStatusFilterOption(page, 'Published')
    await expect(page.getByRole('heading', { name: publishedTitle, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: archivedTitle, exact: true, level: 3 })).not.toBeVisible()
  })
})

test.describe('Filter by Category', () => {
  test('narrows the list to the selected category', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/quick-links')

    const categoryNameA = uniqueQuickLinkCategoryName('filter-category-a')
    await createCategoryThroughUi(page, categoryNameA)
    const titleA = uniqueQuickLinkTitle('filter-category-a')
    await createQuickLinkThroughUi(page, { title: titleA, categoryName: categoryNameA })

    const categoryNameB = uniqueQuickLinkCategoryName('filter-category-b')
    await createCategoryThroughUi(page, categoryNameB)
    const titleB = uniqueQuickLinkTitle('filter-category-b')
    await createQuickLinkThroughUi(page, { title: titleB, categoryName: categoryNameB })

    await toggleCategoryFilterOption(page, categoryNameA)
    await expect(page.getByRole('heading', { name: titleA, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: titleB, exact: true, level: 3 })).not.toBeVisible()

    await toggleCategoryFilterOption(page, categoryNameA)
    await toggleCategoryFilterOption(page, categoryNameB)
    await expect(page.getByRole('heading', { name: titleB, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: titleA, exact: true, level: 3 })).not.toBeVisible()
  })
})

test.describe('Authorization', () => {
  test('a non-admin gets 403 creating a quick link', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-quick-link')

    const response = await page.request.post('/api/quick-links', {
      data: { title: 'Forbidden', excerpt: 'Forbidden', url: 'https://example.com', categoryId: 1, status: 'Published' },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating a quick link', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-quick-link')

    const response = await page.request.put('/api/quick-links/999999', {
      data: { title: 'Forbidden', excerpt: 'Forbidden', url: 'https://example.com', categoryId: 1, status: 'Published' },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting a quick link', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-quick-link')

    const response = await page.request.delete('/api/quick-links/999999')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 creating a quick link category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-category')

    const response = await page.request.post('/api/quick-links/categories', {
      data: { name: uniqueQuickLinkCategoryName('forbidden') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating a quick link category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-category')

    const response = await page.request.put('/api/quick-links/categories/999999', {
      data: { name: uniqueQuickLinkCategoryName('forbidden-update') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting a quick link category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-category')

    const response = await page.request.delete('/api/quick-links/categories/999999')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })
})
