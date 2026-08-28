import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { uniqueResourceCategoryName, uniqueResourceTitle, uniqueResourceUrl } from '../fixtures/resource-data.js'
import { listRowActionButtons, listRowByTitle } from '../fixtures/list-row.js'
import { testEnv } from '../test-env.js'

interface CreatedResource {
  id: number
  title: string
  excerpt: string
  content: string
  url: string | null
  status: string
  category: { id: number; name: string }
  postedBy: { name: string }
}

interface ResourcesListResponse {
  resources: CreatedResource[]
}

const DEFAULT_EXCERPT = 'Created by the Playwright e2e suite.'
const DEFAULT_CONTENT = 'Resource content created by the Playwright e2e suite.'

async function createResourceCategoryViaApi(page: Page, name: string): Promise<number> {
  const createResponse = await page.request.post('/api/resources/categories', { data: { name } })
  if (createResponse.status() !== 201) {
    throw new Error(`Expected 201 creating category ${name}, got ${createResponse.status()}: ${await createResponse.text()}`)
  }
  return categoryIdFromName(page, name)
}

async function categoryIdFromName(page: Page, name: string): Promise<number> {
  const listResponse = await page.request.get('/api/resources/categories')
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing categories, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const listBody: { categories: { id: number; name: string }[] } = await listResponse.json()
  const category = listBody.categories.find((candidate) => candidate.name === name)
  if (!category) {
    throw new Error(`Category "${name}" was not found in the categories list.`)
  }
  return category.id
}

async function createResourceCategoryThroughUi(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Categories' }).click()
  const dialog = page.getByRole('dialog', { name: 'Categories' })

  const nameInput = dialog.getByPlaceholder('New category name')
  await nameInput.fill(name)

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/resources/categories') && response.request().method() === 'POST',
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

async function createResourceThroughUi(
  page: Page,
  {
    title,
    categoryName,
    url,
    status = 'Published',
    excerpt = DEFAULT_EXCERPT,
    content = DEFAULT_CONTENT,
  }: { title: string; categoryName: string; url?: string; status?: 'Published' | 'Archived'; excerpt?: string; content?: string },
): Promise<CreatedResource> {
  await page.getByRole('button', { name: 'Create Resource', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Create Resource' })

  await dialog.getByLabel('Title').fill(title)
  await dialog.getByLabel('Excerpt').fill(excerpt)
  if (url) {
    await dialog.getByLabel('URL').fill(url)
  }
  await dialog.getByLabel('Content').fill(content)

  await dialog.getByLabel('Category').click()
  await page.getByRole('option', { name: categoryName, exact: true }).click()

  await dialog.getByLabel('Status').click()
  await page.getByRole('option', { name: status, exact: true }).click()

  const listResponse = page.waitForResponse(
    (response) => response.url().includes('/api/resources?') && response.request().method() === 'GET',
  )
  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/resources') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Create Resource', exact: true }).click()
  const created = await createResponse
  if (created.status() !== 201) {
    throw new Error(`Expected 201 creating resource ${title}, got ${created.status()}: ${await created.text()}`)
  }

  await expect(dialog).not.toBeVisible()

  const list = await listResponse
  if (list.status() !== 200) {
    throw new Error(`Expected 200 refreshing resources after creating ${title}, got ${list.status()}: ${await list.text()}`)
  }
  const body: ResourcesListResponse = await list.json()
  const resource = body.resources.find((candidate) => candidate.title === title)
  if (!resource) {
    throw new Error(`Resource "${title}" was not found in the resources list response after creation.`)
  }
  return resource
}

function getCardActionButtons(page: Page, title: string) {
  return listRowActionButtons(listRowByTitle(page, title))
}

test.describe('Navigate to Resources', () => {
  test('an admin reaches the resources page from the sidebar', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin')

    await page.getByRole('link', { name: 'Resources' }).click()

    await page.waitForURL('/admin/resources')
    await expect(page.getByRole('heading', { name: 'Resources', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Resource', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible()
  })
})

test.describe('Create Category', () => {
  test('creates a category through the real API and shows it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    await createResourceCategoryThroughUi(page, uniqueResourceCategoryName('create'))
  })
})

test.describe('Rename Category', () => {
  test('renames a category through the real API and reflects it in the manager list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const originalName = uniqueResourceCategoryName('rename')
    await page.getByRole('button', { name: 'Categories' }).click()
    const dialog = page.getByRole('dialog', { name: 'Categories' })

    const nameInput = dialog.getByPlaceholder('New category name')
    await nameInput.fill(originalName)
    const createResponse = page.waitForResponse(
      (response) => response.url().endsWith('/resources/categories') && response.request().method() === 'POST',
    )
    await nameInput.press('Enter')
    const created = await createResponse
    if (created.status() !== 201) {
      throw new Error(`Expected 201 creating category ${originalName}, got ${created.status()}: ${await created.text()}`)
    }
    await expect(dialog.getByText(originalName, { exact: true })).toBeVisible({ timeout: 10000 })

    const categoryId = await categoryIdFromName(page, originalName)
    const row = dialog.getByTestId(`category-row-${categoryId}`)
    await row.getByRole('button').first().click()

    const updatedName = uniqueResourceCategoryName('renamed')
    const renamingRow = dialog.getByTestId(`category-row-${categoryId}`)
    await renamingRow.getByRole('textbox').fill(updatedName)

    const renameResponse = page.waitForResponse(
      (response) => response.url().includes(`/resources/categories/${categoryId}`) && response.request().method() === 'PUT',
    )
    await renamingRow.getByRole('button').first().click()
    const response = await renameResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 renaming category ${categoryId}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog.getByText(updatedName, { exact: true })).toBeVisible()
    await expect(dialog.getByText(originalName, { exact: true })).not.toBeVisible()
  })
})

test.describe('Delete Category', () => {
  test('deletes an unused category through the real API and removes it from the manager list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const name = uniqueResourceCategoryName('delete')
    await page.getByRole('button', { name: 'Categories' }).click()
    const dialog = page.getByRole('dialog', { name: 'Categories' })

    const nameInput = dialog.getByPlaceholder('New category name')
    await nameInput.fill(name)
    const createResponse = page.waitForResponse(
      (response) => response.url().endsWith('/resources/categories') && response.request().method() === 'POST',
    )
    await nameInput.press('Enter')
    const created = await createResponse
    if (created.status() !== 201) {
      throw new Error(`Expected 201 creating category ${name}, got ${created.status()}: ${await created.text()}`)
    }
    await expect(dialog.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 })

    const categoryId = await categoryIdFromName(page, name)
    const row = dialog.getByTestId(`category-row-${categoryId}`)

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes(`/resources/categories/${categoryId}`) && response.request().method() === 'DELETE',
    )
    await row.getByRole('button').nth(1).click()
    const alertDialog = page.getByRole('alertdialog')
    await alertDialog.getByRole('button', { name: 'Delete' }).click()
    const response = await deleteResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deleting category ${categoryId}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog.getByText(name, { exact: true })).not.toBeVisible()
  })

  test('is rejected with a 400 while a resource references it, and it stays in the manager list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('in-use')
    const categoryId = await createResourceCategoryViaApi(page, categoryName)

    const title = uniqueResourceTitle('in-use')
    await createResourceThroughUi(page, { title, categoryName })

    const deleteResponse = await page.request.delete(`/api/resources/categories/${categoryId}`)

    expect(deleteResponse.status()).toBe(400)
    const body: { error: string } = await deleteResponse.json()
    expect(body.error).toBe('Cannot delete category: 1 resource still use it.')

    await page.getByRole('button', { name: 'Categories' }).click()
    const dialog = page.getByRole('dialog', { name: 'Categories' })
    await expect(dialog.getByText(categoryName, { exact: true })).toBeVisible()
  })
})

test.describe('Create Resource', () => {
  test('creates a resource through the real API and shows it in the list with the picked fields', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('use')
    await createResourceCategoryThroughUi(page, categoryName)

    const title = uniqueResourceTitle('create')
    const url = uniqueResourceUrl('create')
    const resource = await createResourceThroughUi(page, { title, categoryName, url, status: 'Published' })

    expect(resource.title).toBe(title)
    expect(resource.status).toBe('Published')
    expect(resource.url).toBe(url)
    expect(resource.category.name).toBe(categoryName)

    const card = listRowByTitle(page, title)
    await expect(card.getByRole('link', { name: title, exact: true })).toBeVisible()
    await expect(card.getByText(categoryName, { exact: true })).toBeVisible()
    await expect(card.getByText('Published', { exact: true })).toBeVisible()

    const listResponse = await page.request.get('/api/resources', { params: { pageSize: 100 } })
    if (listResponse.status() !== 200) {
      throw new Error(`Expected 200 listing resources, got ${listResponse.status()}: ${await listResponse.text()}`)
    }
    const listBody: ResourcesListResponse = await listResponse.json()
    const refetched = listBody.resources.find((candidate) => candidate.id === resource.id)
    if (!refetched) {
      throw new Error(`Resource ${resource.id} was not found in a fresh GET /api/resources after creation.`)
    }
    expect(refetched.title).toBe(title)
    expect(refetched.status).toBe('Published')
    expect(refetched.url).toBe(url)
    expect(refetched.content).toBe(DEFAULT_CONTENT)
    expect(refetched.category.name).toBe(categoryName)
  })

  test('creates a resource without a URL', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('nourl')
    await createResourceCategoryThroughUi(page, categoryName)

    const title = uniqueResourceTitle('nourl')
    const resource = await createResourceThroughUi(page, { title, categoryName })

    expect(resource.url).toBeNull()

    const card = listRowByTitle(page, title)
    await expect(card.getByRole('link', { name: title, exact: true })).toBeVisible()
  })
})

test.describe('Edit Resource', () => {
  test('renames a resource and changes its status through the real API and reflects it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('edit')
    await createResourceCategoryThroughUi(page, categoryName)

    const title = uniqueResourceTitle('edit')
    const resource = await createResourceThroughUi(page, { title, categoryName })

    const { editButton } = getCardActionButtons(page, title)

    const loadResponse = page.waitForResponse(
      (response) => response.url().includes(`/resources/${resource.id}`) && response.request().method() === 'GET',
    )
    await editButton.click()
    const loadResult = await loadResponse
    if (loadResult.status() !== 200) {
      throw new Error(`Expected 200 loading resource ${resource.id}, got ${loadResult.status()}: ${await loadResult.text()}`)
    }

    const dialog = page.getByRole('dialog', { name: 'Edit Resource' })
    await expect(dialog.getByLabel('Title')).toHaveValue(title)

    const updatedTitle = `${title} Updated`
    await dialog.getByLabel('Title').fill(updatedTitle)

    await dialog.getByLabel('Status').click()
    await page.getByRole('option', { name: 'Archived', exact: true }).click()

    const updateResponse = page.waitForResponse(
      (response) => response.url().includes(`/resources/${resource.id}`) && response.request().method() === 'PUT',
    )
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating resource ${resource.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('link', { name: updatedTitle, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: title, exact: true })).not.toBeVisible()

    const detailResponse = await page.request.get(`/api/resources/${resource.id}`)
    if (detailResponse.status() !== 200) {
      throw new Error(`Expected 200 loading resource ${resource.id} after update, got ${detailResponse.status()}: ${await detailResponse.text()}`)
    }
    const detailBody: { resource: CreatedResource } = await detailResponse.json()
    expect(detailBody.resource.title).toBe(updatedTitle)
    expect(detailBody.resource.status).toBe('Archived')
  })
})

test.describe('Delete Resource', () => {
  test('removes a resource through the real API', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('delete')
    await createResourceCategoryThroughUi(page, categoryName)

    const title = uniqueResourceTitle('delete')
    const resource = await createResourceThroughUi(page, { title, categoryName })

    const { deleteButton } = getCardActionButtons(page, title)
    await deleteButton.click()

    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: `Delete "${title}"?` })).toBeVisible()

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes(`/resources/${resource.id}`) && response.request().method() === 'DELETE',
    )
    await alertDialog.getByRole('button', { name: 'Delete' }).click()
    const response = await deleteResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deleting resource ${resource.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('link', { name: title, exact: true })).not.toBeVisible()

    const getResponse = await page.request.get(`/api/resources/${resource.id}`)
    expect(getResponse.status()).toBe(404)
  })
})

test.describe('Resource Detail Page', () => {
  test('navigates from a resource card to its detail page and shows the full resource', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('detail')
    await createResourceCategoryThroughUi(page, categoryName)

    const title = uniqueResourceTitle('detail')
    const url = uniqueResourceUrl('detail')
    const resource = await createResourceThroughUi(page, { title, categoryName, url })

    const card = listRowByTitle(page, title)
    await card.getByRole('link', { name: title, exact: true }).click()

    await page.waitForURL(`/admin/resources/${resource.id}`)
    await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible()
    await expect(page.getByText(DEFAULT_EXCERPT, { exact: true })).toBeVisible()
    await expect(page.getByText(categoryName, { exact: true })).toBeVisible()
    await expect(page.getByText('Published', { exact: true })).toBeVisible()
    await expect(page.getByText(`Posted by ${testEnv.SEED_ADMIN_NAME}`, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: url, exact: true })).toHaveAttribute('href', url)
    await expect(page.getByText(DEFAULT_CONTENT, { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Back' }).click()
    await page.waitForURL('/admin/resources')
  })

  test('edits a resource from its detail page through the real API', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('detail-edit')
    await createResourceCategoryThroughUi(page, categoryName)

    const title = uniqueResourceTitle('detail-edit')
    const resource = await createResourceThroughUi(page, { title, categoryName })

    await page.goto(`/admin/resources/${resource.id}`)
    await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible()

    await page.getByTestId('resource-detail-edit').click()

    const dialog = page.getByRole('dialog', { name: 'Edit Resource' })
    await expect(dialog.getByLabel('Title')).toHaveValue(title)
    const updatedTitle = `${title} Updated`
    await dialog.getByLabel('Title').fill(updatedTitle)

    const updateResponse = page.waitForResponse(
      (response) => response.url().includes(`/resources/${resource.id}`) && response.request().method() === 'PUT',
    )
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating resource ${resource.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('heading', { name: updatedTitle, exact: true, level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).not.toBeVisible()
    await expect(page).toHaveURL(`/admin/resources/${resource.id}`)
  })

  test('deletes a resource from its detail page through the real API and returns to the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/resources')

    const categoryName = uniqueResourceCategoryName('detail-delete')
    await createResourceCategoryThroughUi(page, categoryName)

    const title = uniqueResourceTitle('detail-delete')
    const resource = await createResourceThroughUi(page, { title, categoryName })

    await page.goto(`/admin/resources/${resource.id}`)
    await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible()

    await page.getByTestId('resource-detail-delete').click()
    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: `Delete "${title}"?` })).toBeVisible()

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes(`/resources/${resource.id}`) && response.request().method() === 'DELETE',
    )
    await alertDialog.getByRole('button', { name: 'Delete' }).click()
    const response = await deleteResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deleting resource ${resource.id}, got ${response.status()}: ${await response.text()}`)
    }

    await page.waitForURL('/admin/resources')
    await expect(page.getByRole('link', { name: title, exact: true })).not.toBeVisible()

    const getResponse = await page.request.get(`/api/resources/${resource.id}`)
    expect(getResponse.status()).toBe(404)
  })
})

test.describe('Authorization', () => {
  test('a non-admin gets 403 creating a resource', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-resource')

    const response = await page.request.post('/api/resources', {
      data: {
        title: 'Forbidden',
        excerpt: 'Forbidden',
        content: 'Forbidden',
        categoryId: 1,
        status: 'Published',
      },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating a resource', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-resource')

    const response = await page.request.put('/api/resources/999999', {
      data: {
        title: 'Forbidden',
        excerpt: 'Forbidden',
        content: 'Forbidden',
        categoryId: 1,
        status: 'Published',
      },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting a resource', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-resource')

    const response = await page.request.delete('/api/resources/999999')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 creating a resource category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-category')

    const response = await page.request.post('/api/resources/categories', {
      data: { name: uniqueResourceCategoryName('forbidden') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating a resource category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-category')

    const response = await page.request.put('/api/resources/categories/999999', {
      data: { name: uniqueResourceCategoryName('forbidden-update') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting a resource category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-category')

    const response = await page.request.delete('/api/resources/categories/999999')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })
})
