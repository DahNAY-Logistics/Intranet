import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { uniqueBannerTitle, uniqueCategoryName } from '../fixtures/banner-data.js'
import { nonLandscapeBannerImage, undersizedBannerImage, validBannerImage } from '../fixtures/banner-image.js'
import { withDb } from '../fixtures/db.js'

interface CreatedBanner {
  id: number
  title: string
  status: string
  displayOrder: number
  attachment: { id: number }
}

interface BannersListResponse {
  banners: CreatedBanner[]
}

interface CreatedCategory {
  id: number
  name: string
}

interface CategoriesListResponse {
  categories: CreatedCategory[]
}

async function createCategoryThroughUi(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Categories' }).click()
  const dialog = page.getByRole('dialog', { name: 'Categories' })

  const nameInput = dialog.getByPlaceholder('New category name')
  await nameInput.fill(name)

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/banners/categories') && response.request().method() === 'POST',
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

async function createBannerThroughUi(
  page: Page,
  { title, categoryName }: { title: string; categoryName: string },
): Promise<CreatedBanner> {
  await page.getByRole('button', { name: 'Create Banner' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create Banner' })

  await dialog.getByLabel('Title').fill(title)
  await dialog.getByLabel('Excerpt').fill('Created by the Playwright e2e suite.')

  await dialog.getByLabel('Category').click()
  await page.getByRole('option', { name: categoryName, exact: true }).click()

  await dialog.getByLabel('Status').click()
  await page.getByRole('option', { name: 'Published', exact: true }).click()

  const uploadResponse = page.waitForResponse(
    (response) => response.url().endsWith('/attachments') && response.request().method() === 'POST',
  )
  await dialog
    .getByTestId('banner-image-input')
    .setInputFiles({ name: 'banner.png', mimeType: 'image/png', buffer: validBannerImage() })
  const uploadResult = await uploadResponse
  if (uploadResult.status() !== 201) {
    throw new Error(`Expected 201 uploading banner image, got ${uploadResult.status()}: ${await uploadResult.text()}`)
  }
  await expect(dialog.getByAltText('Banner preview')).toBeVisible()

  await dialog.getByRole('button', { name: 'Pick a date' }).first().click()
  await page.getByRole('button', { name: /^Today,/ }).last().click()

  await dialog.getByRole('button', { name: 'Pick a date' }).first().click()
  await page.getByRole('button', { name: /^Today,/ }).last().click()
  await page.keyboard.press('Escape')

  const listResponse = page.waitForResponse(
    (response) => response.url().includes('/api/banners?') && response.request().method() === 'GET',
  )
  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/banners') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Create Banner' }).click()
  const created = await createResponse
  if (created.status() !== 201) {
    throw new Error(`Expected 201 creating banner ${title}, got ${created.status()}: ${await created.text()}`)
  }

  await expect(dialog).not.toBeVisible()

  const list = await listResponse
  if (list.status() !== 200) {
    throw new Error(`Expected 200 refreshing banners after creating ${title}, got ${list.status()}: ${await list.text()}`)
  }
  const body: BannersListResponse = await list.json()
  const banner = body.banners.find((candidate) => candidate.title === title)
  if (!banner) {
    throw new Error(`Banner "${title}" was not found in the banners list response after creation.`)
  }
  return banner
}

async function getPublishedCardActionButtons(page: Page, title: string) {
  const buttonsPerCard = 3
  const titles = await page.getByRole('heading', { level: 3 }).allTextContents()
  const index = titles.indexOf(title)
  if (index === -1) {
    throw new Error(`Banner "${title}" was not found among the rendered cards: ${titles.join(', ')}`)
  }

  const buttons = page.getByRole('button')
  const totalButtons = await buttons.count()
  const chromeButtonCount = totalButtons - titles.length * buttonsPerCard
  const base = chromeButtonCount + index * buttonsPerCard
  return { editButton: buttons.nth(base + 1), deleteButton: buttons.nth(base + 2) }
}

test.describe('Navigate to Banners', () => {
  test('an admin reaches the banners page from the sidebar', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin')

    await page.getByRole('link', { name: 'Banners' }).click()

    await page.waitForURL('/admin/banners')
    await expect(page.getByRole('heading', { name: 'Banners', level: 1 })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Archived' })).toBeVisible()
  })
})

test.describe('Create Category', () => {
  test('creates a category through the real API and shows it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/banners')

    await createCategoryThroughUi(page, uniqueCategoryName('create'))
  })
})

test.describe('Create Banner', () => {
  test('uploads a real image and creates a banner that appears in the Published tab', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/banners')

    const categoryName = uniqueCategoryName('create-banner')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueBannerTitle('create')
    const banner = await createBannerThroughUi(page, { title, categoryName })

    expect(banner.title).toBe(title)
    expect(banner.status).toBe('Published')
    await expect(page.getByRole('heading', { name: title, exact: true, level: 3 })).toBeVisible()
  })
})

test.describe('Edit Banner', () => {
  test('renames a banner through the real API and reflects it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/banners')

    const categoryName = uniqueCategoryName('edit')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueBannerTitle('edit')
    const banner = await createBannerThroughUi(page, { title, categoryName })

    const { editButton } = await getPublishedCardActionButtons(page, title)

    const bannerLoadResponse = page.waitForResponse(
      (response) => response.url().includes(`/banners/${banner.id}`) && response.request().method() === 'GET',
    )
    await editButton.click()
    const loadResult = await bannerLoadResponse
    if (loadResult.status() !== 200) {
      throw new Error(`Expected 200 loading banner ${banner.id}, got ${loadResult.status()}: ${await loadResult.text()}`)
    }

    const dialog = page.getByRole('dialog', { name: 'Edit Banner' })
    await expect(dialog.getByLabel('Title')).toHaveValue(title)

    const updatedTitle = `${title} Updated`
    await dialog.getByLabel('Title').fill(updatedTitle)

    const updateResponse = page.waitForResponse(
      (response) => response.url().includes(`/banners/${banner.id}`) && response.request().method() === 'PUT',
    )
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating banner ${banner.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('heading', { name: updatedTitle, exact: true, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: title, exact: true, level: 3 })).not.toBeVisible()
  })
})

test.describe('Delete Banner', () => {
  test('removes a banner through the real API and cleans up its attachment', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/banners')

    const categoryName = uniqueCategoryName('delete')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueBannerTitle('delete')
    const banner = await createBannerThroughUi(page, { title, categoryName })

    const { deleteButton } = await getPublishedCardActionButtons(page, title)
    await deleteButton.click()

    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: `Delete "${title}"?` })).toBeVisible()

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes(`/banners/${banner.id}`) && response.request().method() === 'DELETE',
    )
    await alertDialog.getByRole('button', { name: 'Delete' }).click()
    const response = await deleteResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deleting banner ${banner.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('heading', { name: title, exact: true, level: 3 })).not.toBeVisible()

    const remainingAttachment = await withDb((client) =>
      client.query('select id from "attachment" where id = $1', [banner.attachment.id]),
    )
    expect(remainingAttachment.rows).toHaveLength(0)
  })
})

test.describe('Reorder Banners', () => {
  test('reorders published banners through the real API and the list reflects it', async ({ page }) => {
    await signInAsAdmin(page.context())

    const categoryName = uniqueCategoryName('reorder')
    const categoryResponse = await page.request.post('/api/banners/categories', { data: { name: categoryName } })
    if (categoryResponse.status() !== 201) {
      throw new Error(`Expected 201 creating category, got ${categoryResponse.status()}: ${await categoryResponse.text()}`)
    }

    const categoriesListResponse = await page.request.get('/api/banners/categories')
    if (categoriesListResponse.status() !== 200) {
      throw new Error(`Expected 200 listing categories, got ${categoriesListResponse.status()}: ${await categoriesListResponse.text()}`)
    }
    const categoriesBody: CategoriesListResponse = await categoriesListResponse.json()
    const category = categoriesBody.categories.find((candidate) => candidate.name === categoryName)
    if (!category) {
      throw new Error(`Category "${categoryName}" was not found in the categories list response after creation.`)
    }

    const titles = [uniqueBannerTitle('reorder-a'), uniqueBannerTitle('reorder-b'), uniqueBannerTitle('reorder-c')]

    for (const title of titles) {
      const attachmentResponse = await page.request.post('/api/attachments', {
        multipart: { file: { name: 'banner.png', mimeType: 'image/png', buffer: validBannerImage() } },
      })
      if (attachmentResponse.status() !== 201) {
        throw new Error(
          `Expected 201 uploading attachment for ${title}, got ${attachmentResponse.status()}: ${await attachmentResponse.text()}`,
        )
      }
      const attachment: { id: number } = await attachmentResponse.json()

      const bannerResponse = await page.request.post('/api/banners', {
        data: {
          title,
          excerpt: 'Created by the Playwright e2e suite.',
          categoryId: category.id,
          attachmentId: attachment.id,
          status: 'Published',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      })
      if (bannerResponse.status() !== 201) {
        throw new Error(`Expected 201 creating banner ${title}, got ${bannerResponse.status()}: ${await bannerResponse.text()}`)
      }
    }

    const publishedListResponse = await page.request.get('/api/banners?status=Published')
    if (publishedListResponse.status() !== 200) {
      throw new Error(`Expected 200 listing published banners, got ${publishedListResponse.status()}: ${await publishedListResponse.text()}`)
    }
    const publishedBody: BannersListResponse = await publishedListResponse.json()
    const banners = titles.map((title) => {
      const found = publishedBody.banners.find((candidate) => candidate.title === title)
      if (!found) {
        throw new Error(`Banner "${title}" was not found in the published banners list response after creation.`)
      }
      return found
    })

    const [first, second, third] = banners as [CreatedBanner, CreatedBanner, CreatedBanner]

    const reorderResponse = await page.request.patch('/api/banners/reorder', {
      data: {
        items: [
          { id: third.id, displayOrder: 1 },
          { id: first.id, displayOrder: 2 },
          { id: second.id, displayOrder: 3 },
        ],
      },
    })
    if (reorderResponse.status() !== 200) {
      throw new Error(`Expected 200 reordering banners, got ${reorderResponse.status()}: ${await reorderResponse.text()}`)
    }

    await page.goto('/admin/banners')
    await expect(page.getByRole('heading', { name: titles[2]!, exact: true, level: 3 })).toBeVisible()

    const renderedTitles = await page.getByRole('heading', { level: 3 }).allTextContents()
    const indexThird = renderedTitles.indexOf(titles[2]!)
    const indexFirst = renderedTitles.indexOf(titles[0]!)
    const indexSecond = renderedTitles.indexOf(titles[1]!)

    expect(indexThird).toBeGreaterThanOrEqual(0)
    expect(indexThird).toBeLessThan(indexFirst)
    expect(indexFirst).toBeLessThan(indexSecond)
  })
})

test.describe('Image validation', () => {
  test('rejects an upload narrower than the minimum width', async ({ page }) => {
    await signInAsAdmin(page.context())

    const response = await page.request.post('/api/attachments', {
      multipart: { file: { name: 'small.png', mimeType: 'image/png', buffer: undersizedBannerImage() } },
    })

    expect(response.status()).toBe(400)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Image must be at least 800px wide.')
  })

  test('rejects a wide-enough upload that is not landscape', async ({ page }) => {
    await signInAsAdmin(page.context())

    const response = await page.request.post('/api/attachments', {
      multipart: { file: { name: 'square.png', mimeType: 'image/png', buffer: nonLandscapeBannerImage() } },
    })

    expect(response.status()).toBe(400)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Image must be landscape (wider than it is tall) to fit the homepage slider.')
  })
})

test.describe('Authorization', () => {
  test('a non-admin gets 403 listing banners', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'list')

    const response = await page.request.get('/api/banners?status=Published')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 creating a category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-category')

    const response = await page.request.post('/api/banners/categories', {
      data: { name: uniqueCategoryName('forbidden') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })
})
