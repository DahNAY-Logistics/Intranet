import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

import { signInAsAdmin } from '../fixtures/admin-session.js'
import { signInAsRegularUser } from '../fixtures/regular-user-session.js'
import { uniqueEventCategoryName, uniqueEventTitle } from '../fixtures/event-data.js'
import { listRowActionButtons, listRowByTitle } from '../fixtures/list-row.js'

interface CreatedEventCategory {
  id: number
  name: string
}

interface CreatedEvent {
  id: number
  title: string
  excerpt: string
  status: string
  mode: string
  location: string
  startDate: string
  endDate: string
  category: { id: number; name: string }
  postedBy: { name: string }
}

interface EventsListResponse {
  events: CreatedEvent[]
}

async function createCategoryThroughUi(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Categories' }).click()
  const dialog = page.getByRole('dialog', { name: 'Categories' })

  const nameInput = dialog.getByPlaceholder('New category name')
  await nameInput.fill(name)

  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/events/categories') && response.request().method() === 'POST',
  )
  await nameInput.press('Enter')
  const response = await createResponse
  if (response.status() !== 201) {
    throw new Error(`Expected 201 creating category ${name}, got ${response.status()}: ${await response.text()}`)
  }

  await expect(dialog.getByText(name, { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
}

async function createEventCategoryViaApi(page: Page, name: string): Promise<CreatedEventCategory> {
  const createResponse = await page.request.post('/api/events/categories', { data: { name } })
  if (createResponse.status() !== 201) {
    throw new Error(`Expected 201 creating category ${name}, got ${createResponse.status()}: ${await createResponse.text()}`)
  }

  const listResponse = await page.request.get('/api/events/categories')
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing event categories, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const body: { categories: CreatedEventCategory[] } = await listResponse.json()
  const category = body.categories.find((candidate) => candidate.name === name)
  if (!category) {
    throw new Error(`Category "${name}" was not found after creation.`)
  }
  return category
}

async function createEventThroughUi(
  page: Page,
  options: { title: string; categoryName: string; status?: 'Published' | 'Archived'; mode?: 'Online' | 'Offline' | 'Hybrid'; location?: string },
): Promise<CreatedEvent> {
  const { title, categoryName, status = 'Published', mode = 'Hybrid', location = 'Main Auditorium' } = options

  await page.getByRole('button', { name: 'Create Event', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Create Event' })

  await dialog.getByLabel('Title').fill(title)
  await dialog.getByLabel('Excerpt').fill('Created by the Playwright e2e suite.')

  await dialog.getByLabel('Category').click()
  await page.getByRole('option', { name: categoryName, exact: true }).click()

  await dialog.getByLabel('Status').click()
  await page.getByRole('option', { name: status, exact: true }).click()

  await dialog.getByLabel('Mode').click()
  await page.getByRole('option', { name: mode, exact: true }).click()

  if (mode !== 'Online') {
    await dialog.getByLabel('Location').fill(location)
  }

  await dialog.getByRole('button', { name: 'Pick a date' }).first().click()
  await page.getByRole('button', { name: /^Today,/ }).last().click()
  await dialog.getByTestId('start-time-input').fill('09:00')

  await dialog.getByRole('button', { name: 'Pick a date' }).first().click()
  await page.getByRole('button', { name: /^Today,/ }).last().click()
  await dialog.getByTestId('end-time-input').fill('17:00')

  const listResponse = page.waitForResponse(
    (response) => response.url().includes('/api/events?') && response.request().method() === 'GET',
  )
  const createResponse = page.waitForResponse(
    (response) => response.url().endsWith('/events') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Create Event', exact: true }).click()
  const created = await createResponse
  if (created.status() !== 201) {
    throw new Error(`Expected 201 creating event ${title}, got ${created.status()}: ${await created.text()}`)
  }

  await expect(dialog).not.toBeVisible()

  const list = await listResponse
  if (list.status() !== 200) {
    throw new Error(`Expected 200 refreshing events after creating ${title}, got ${list.status()}: ${await list.text()}`)
  }
  const body: EventsListResponse = await list.json()
  const event = body.events.find((candidate) => candidate.title === title)
  if (!event) {
    throw new Error(`Event "${title}" was not found in the events list response after creation.`)
  }
  return event
}

function getCardActionButtons(page: Page, title: string) {
  return listRowActionButtons(listRowByTitle(page, title))
}

test.describe('Navigate to Events', () => {
  test('an admin reaches the events page from the sidebar', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin')

    await page.getByRole('link', { name: 'Events' }).click()

    await page.waitForURL('/admin/events')
    await expect(page.getByRole('heading', { name: 'Events', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Event', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible()
  })
})

test.describe('Create Category', () => {
  test('creates a category through the real API and shows it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/events')

    await createCategoryThroughUi(page, uniqueEventCategoryName('create'))
  })
})

test.describe('Create Event', () => {
  test('creates an event through the real API and shows it in the list with the picked fields', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/events')

    const categoryName = uniqueEventCategoryName('use')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueEventTitle('create')
    const event = await createEventThroughUi(page, { title, categoryName, status: 'Published', mode: 'Hybrid', location: 'Main Auditorium' })

    expect(event.title).toBe(title)
    expect(event.status).toBe('Published')
    expect(event.mode).toBe('Hybrid')
    expect(event.location).toBe('Main Auditorium')
    expect(event.category.name).toBe(categoryName)
    expect(new Date(event.startDate).getHours()).toBe(9)
    expect(new Date(event.endDate).getHours()).toBe(17)

    const card = listRowByTitle(page, title)
    await expect(card.getByRole('link', { name: title, exact: true })).toBeVisible()
    await expect(card.getByText(categoryName, { exact: true })).toBeVisible()
    await expect(card.getByText('Published', { exact: true })).toBeVisible()
    await expect(card.getByText('Hybrid', { exact: true })).toBeVisible()
    await expect(card.getByText('Main Auditorium', { exact: true })).toBeVisible()

    const listResponse = await page.request.get('/api/events', { params: { pageSize: 100 } })
    if (listResponse.status() !== 200) {
      throw new Error(`Expected 200 listing events, got ${listResponse.status()}: ${await listResponse.text()}`)
    }
    const listBody: EventsListResponse = await listResponse.json()
    const refetched = listBody.events.find((candidate) => candidate.id === event.id)
    if (!refetched) {
      throw new Error(`Event ${event.id} was not found in a fresh GET /api/events after creation.`)
    }
    expect(refetched.title).toBe(title)
    expect(refetched.status).toBe('Published')
    expect(refetched.mode).toBe('Hybrid')
    expect(refetched.category.name).toBe(categoryName)
  })
})

test.describe('Edit Event', () => {
  test('renames an event and changes its status through the real API and reflects it in the list', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/events')

    const categoryName = uniqueEventCategoryName('edit')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueEventTitle('edit')
    const event = await createEventThroughUi(page, { title, categoryName })

    const { editButton } = await getCardActionButtons(page, title)

    const loadResponse = page.waitForResponse(
      (response) => response.url().includes(`/events/${event.id}`) && response.request().method() === 'GET',
    )
    await editButton.click()
    const loadResult = await loadResponse
    if (loadResult.status() !== 200) {
      throw new Error(`Expected 200 loading event ${event.id}, got ${loadResult.status()}: ${await loadResult.text()}`)
    }

    const dialog = page.getByRole('dialog', { name: 'Edit Event' })
    await expect(dialog.getByLabel('Title')).toHaveValue(title)

    const updatedTitle = `${title} Updated`
    await dialog.getByLabel('Title').fill(updatedTitle)

    await dialog.getByLabel('Status').click()
    await page.getByRole('option', { name: 'Archived', exact: true }).click()

    const updateResponse = page.waitForResponse(
      (response) => response.url().includes(`/events/${event.id}`) && response.request().method() === 'PUT',
    )
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    const response = await updateResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 updating event ${event.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('link', { name: updatedTitle, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: title, exact: true })).not.toBeVisible()

    const detailResponse = await page.request.get(`/api/events/${event.id}`)
    if (detailResponse.status() !== 200) {
      throw new Error(`Expected 200 loading event ${event.id} after update, got ${detailResponse.status()}: ${await detailResponse.text()}`)
    }
    const detailBody: { event: CreatedEvent } = await detailResponse.json()
    expect(detailBody.event.title).toBe(updatedTitle)
    expect(detailBody.event.status).toBe('Archived')
  })
})

test.describe('Delete Event', () => {
  test('removes an event through the real API', async ({ page }) => {
    await signInAsAdmin(page.context())
    await page.goto('/admin/events')

    const categoryName = uniqueEventCategoryName('delete')
    await createCategoryThroughUi(page, categoryName)

    const title = uniqueEventTitle('delete')
    const event = await createEventThroughUi(page, { title, categoryName })

    const { deleteButton } = await getCardActionButtons(page, title)
    await deleteButton.click()

    const alertDialog = page.getByRole('alertdialog')
    await expect(alertDialog.getByRole('heading', { name: `Delete "${title}"?` })).toBeVisible()

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes(`/events/${event.id}`) && response.request().method() === 'DELETE',
    )
    await alertDialog.getByRole('button', { name: 'Delete' }).click()
    const response = await deleteResponse
    if (response.status() !== 200) {
      throw new Error(`Expected 200 deleting event ${event.id}, got ${response.status()}: ${await response.text()}`)
    }

    await expect(page.getByRole('link', { name: title, exact: true })).not.toBeVisible()

    const getResponse = await page.request.get(`/api/events/${event.id}`)
    expect(getResponse.status()).toBe(404)
  })
})

test.describe('Server-side mode validation', () => {
  test('rejects a Hybrid event with no location through the real API', async ({ page }) => {
    await signInAsAdmin(page.context())

    const categoryName = uniqueEventCategoryName('hybrid')
    const category = await createEventCategoryViaApi(page, categoryName)

    const response = await page.request.post('/api/events', {
      data: {
        title: uniqueEventTitle('hybrid-reject'),
        excerpt: 'Created by the Playwright e2e suite.',
        categoryId: category.id,
        status: 'Published',
        mode: 'Hybrid',
        location: '',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
    })

    expect(response.status()).toBe(400)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Location is required')
  })
})

test.describe('Authorization', () => {
  test('a non-admin gets 403 creating an event', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-event')

    const response = await page.request.post('/api/events', {
      data: {
        title: 'Forbidden',
        excerpt: 'Forbidden',
        categoryId: 1,
        status: 'Published',
        mode: 'Online',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating an event', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-event')

    const response = await page.request.put('/api/events/999999', {
      data: {
        title: 'Forbidden',
        excerpt: 'Forbidden',
        categoryId: 1,
        status: 'Published',
        mode: 'Online',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting an event', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-event')

    const response = await page.request.delete('/api/events/999999')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 creating an event category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'create-category')

    const response = await page.request.post('/api/events/categories', {
      data: { name: uniqueEventCategoryName('forbidden') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 updating an event category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'update-category')

    const response = await page.request.put('/api/events/categories/999999', {
      data: { name: uniqueEventCategoryName('forbidden-update') },
    })

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })

  test('a non-admin gets 403 deleting an event category', async ({ page }) => {
    await signInAsRegularUser(page.context(), 'delete-category')

    const response = await page.request.delete('/api/events/categories/999999')

    expect(response.status()).toBe(403)
    const body: { error: string } = await response.json()
    expect(body.error).toBe('Forbidden')
  })
})
