import { randomUUID } from 'node:crypto'

export function uniqueBannerTitle(label: string): string {
  return `E2E Banner ${label} ${randomUUID().slice(0, 8)}`
}

export function uniqueCategoryName(label: string): string {
  const suffix = randomUUID().slice(0, 6)
  return `Bn ${label.slice(0, 10)} ${suffix}`
}
