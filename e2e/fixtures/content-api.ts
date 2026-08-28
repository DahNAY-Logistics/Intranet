import type { APIRequestContext } from '@playwright/test'

import { uniqueAnnouncementCategoryName, uniqueAnnouncementTitle } from './announcement-data.js'
import { uniqueBannerTitle, uniqueCategoryName as uniqueBannerCategoryName } from './banner-data.js'
import { validBannerImage } from './banner-image.js'
import { uniqueEventCategoryName, uniqueEventTitle } from './event-data.js'
import { uniqueQuickLinkCategoryName, uniqueQuickLinkTitle, uniqueQuickLinkUrl } from './quick-link-data.js'
import { uniqueResourceCategoryName, uniqueResourceTitle, uniqueResourceUrl } from './resource-data.js'

type ContentStatus = 'Published' | 'Archived'

async function createCategoryViaApi(request: APIRequestContext, basePath: string, name: string): Promise<number> {
  const createResponse = await request.post(`${basePath}/categories`, { data: { name } })
  if (createResponse.status() !== 201) {
    throw new Error(
      `Expected 201 creating category ${name} at ${basePath}, got ${createResponse.status()}: ${await createResponse.text()}`,
    )
  }

  const listResponse = await request.get(`${basePath}/categories`)
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing categories at ${basePath}, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const body: { categories: { id: number; name: string }[] } = await listResponse.json()
  const match = body.categories.find((category) => category.name === name)
  if (!match) {
    throw new Error(`Category "${name}" was not found in the list after creation at ${basePath}`)
  }
  return match.id
}

export interface CreatedAnnouncement {
  id: number
  title: string
}

export async function createAnnouncementViaApi(
  request: APIRequestContext,
  label: string,
  status: ContentStatus = 'Published',
): Promise<CreatedAnnouncement> {
  const categoryId = await createCategoryViaApi(request, '/api/announcements', uniqueAnnouncementCategoryName(label))
  const title = uniqueAnnouncementTitle(label)

  const createResponse = await request.post('/api/announcements', {
    data: { title, excerpt: `Excerpt for ${title}`, categoryId, status },
  })
  if (createResponse.status() !== 201) {
    throw new Error(`Expected 201 creating announcement ${title}, got ${createResponse.status()}: ${await createResponse.text()}`)
  }

  const listResponse = await request.get('/api/announcements', { params: { categoryId, pageSize: 10 } })
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing announcements, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const body: { announcements: { id: number; title: string }[] } = await listResponse.json()
  const created = body.announcements.find((announcement) => announcement.title === title)
  if (!created) {
    throw new Error(`Announcement "${title}" was not found in the list after creation`)
  }
  return created
}

export interface CreatedEvent {
  id: number
  title: string
}

export async function createEventViaApi(
  request: APIRequestContext,
  label: string,
  options: { status?: ContentStatus; startDate?: Date; endDate?: Date } = {},
): Promise<CreatedEvent> {
  const categoryId = await createCategoryViaApi(request, '/api/events', uniqueEventCategoryName(label))
  const title = uniqueEventTitle(label)
  const now = new Date()
  const startDate = options.startDate ?? now
  const endDate = options.endDate ?? new Date(now.getTime() + 60 * 60 * 1000)

  const createResponse = await request.post('/api/events', {
    data: {
      title,
      excerpt: `Excerpt for ${title}`,
      categoryId,
      status: options.status ?? 'Published',
      mode: 'Online',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  })
  if (createResponse.status() !== 201) {
    throw new Error(`Expected 201 creating event ${title}, got ${createResponse.status()}: ${await createResponse.text()}`)
  }

  const listResponse = await request.get('/api/events', { params: { categoryId, pageSize: 10 } })
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing events, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const body: { events: { id: number; title: string }[] } = await listResponse.json()
  const created = body.events.find((event) => event.title === title)
  if (!created) {
    throw new Error(`Event "${title}" was not found in the list after creation`)
  }
  return created
}

export interface CreatedQuickLink {
  id: number
  title: string
}

export async function createQuickLinkViaApi(
  request: APIRequestContext,
  label: string,
  status: ContentStatus = 'Published',
): Promise<CreatedQuickLink> {
  const categoryId = await createCategoryViaApi(request, '/api/quick-links', uniqueQuickLinkCategoryName(label))
  const title = uniqueQuickLinkTitle(label)
  const url = uniqueQuickLinkUrl(label)

  const createResponse = await request.post('/api/quick-links', {
    data: { title, excerpt: `Excerpt for ${title}`, url, categoryId, status },
  })
  if (createResponse.status() !== 201) {
    throw new Error(`Expected 201 creating quick link ${title}, got ${createResponse.status()}: ${await createResponse.text()}`)
  }

  const listResponse = await request.get('/api/quick-links', { params: { categoryId, pageSize: 10 } })
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing quick links, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const body: { quickLinks: { id: number; title: string }[] } = await listResponse.json()
  const created = body.quickLinks.find((quickLink) => quickLink.title === title)
  if (!created) {
    throw new Error(`Quick link "${title}" was not found in the list after creation`)
  }
  return created
}

export interface CreatedResource {
  id: number
  title: string
}

export async function createResourceViaApi(
  request: APIRequestContext,
  label: string,
  status: ContentStatus = 'Published',
): Promise<CreatedResource> {
  const categoryId = await createCategoryViaApi(request, '/api/resources', uniqueResourceCategoryName(label))
  const title = uniqueResourceTitle(label)
  const url = uniqueResourceUrl(label)

  const createResponse = await request.post('/api/resources', {
    data: {
      title,
      excerpt: `Excerpt for ${title}`,
      content: `Content for ${title}`,
      url,
      categoryId,
      status,
    },
  })
  if (createResponse.status() !== 201) {
    throw new Error(`Expected 201 creating resource ${title}, got ${createResponse.status()}: ${await createResponse.text()}`)
  }

  const listResponse = await request.get('/api/resources', { params: { categoryId, pageSize: 10 } })
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing resources, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const body: { resources: { id: number; title: string }[] } = await listResponse.json()
  const created = body.resources.find((resource) => resource.title === title)
  if (!created) {
    throw new Error(`Resource "${title}" was not found in the list after creation`)
  }
  return created
}

export interface CreatedBanner {
  id: number
  title: string
}

export async function createBannerViaApi(request: APIRequestContext, label: string): Promise<CreatedBanner> {
  const categoryId = await createCategoryViaApi(request, '/api/banners', uniqueBannerCategoryName(label))

  const attachmentResponse = await request.post('/api/attachments', {
    multipart: { file: { name: 'banner.png', mimeType: 'image/png', buffer: validBannerImage() } },
  })
  if (attachmentResponse.status() !== 201) {
    throw new Error(`Expected 201 uploading banner image, got ${attachmentResponse.status()}: ${await attachmentResponse.text()}`)
  }
  const attachment: { id: number } = await attachmentResponse.json()

  const title = uniqueBannerTitle(label)
  const now = new Date()
  const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const createResponse = await request.post('/api/banners', {
    data: {
      title,
      excerpt: `Excerpt for ${title}`,
      categoryId,
      attachmentId: attachment.id,
      status: 'Published',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  })
  if (createResponse.status() !== 201) {
    throw new Error(`Expected 201 creating banner ${title}, got ${createResponse.status()}: ${await createResponse.text()}`)
  }

  const listResponse = await request.get('/api/banners', { params: { status: 'Published' } })
  if (listResponse.status() !== 200) {
    throw new Error(`Expected 200 listing banners, got ${listResponse.status()}: ${await listResponse.text()}`)
  }
  const body: { banners: { id: number; title: string }[] } = await listResponse.json()
  const created = body.banners.find((banner) => banner.title === title)
  if (!created) {
    throw new Error(`Banner "${title}" was not found in the list after creation`)
  }
  return created
}
