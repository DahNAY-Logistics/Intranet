import { randomUUID } from 'node:crypto'

export function uniqueResourceTitle(label: string): string {
  return `E2E Resource ${label} ${randomUUID().slice(0, 8)}`
}

export function uniqueResourceCategoryName(label: string): string {
  const suffix = randomUUID().slice(0, 6)
  return `Rs ${label.slice(0, 10)} ${suffix}`
}

export function uniqueResourceUrl(label: string): string {
  return `https://example.com/${label}-${randomUUID().slice(0, 8)}`
}
