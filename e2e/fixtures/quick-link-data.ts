import { randomUUID } from 'node:crypto'

export function uniqueQuickLinkTitle(label: string): string {
  return `E2E Quick Link ${label} ${randomUUID().slice(0, 8)}`
}

export function uniqueQuickLinkCategoryName(label: string): string {
  const suffix = randomUUID().slice(0, 6)
  return `Ql ${label.slice(0, 10)} ${suffix}`
}

export function uniqueQuickLinkUrl(label: string): string {
  return `https://example.com/${label}-${randomUUID().slice(0, 8)}`
}
