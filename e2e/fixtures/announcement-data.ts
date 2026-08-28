import { randomUUID } from 'node:crypto'

export function uniqueAnnouncementTitle(label: string): string {
  return `E2E Announcement ${label} ${randomUUID().slice(0, 8)}`
}

export function uniqueAnnouncementCategoryName(label: string): string {
  const suffix = randomUUID().slice(0, 6)
  return `An ${label.slice(0, 10)} ${suffix}`
}
