import { randomUUID } from 'node:crypto'

export function uniqueSiteName(label: string): string {
  return `E2E Site ${label} ${randomUUID().slice(0, 8)}`
}

export function uniqueOrganizationName(label: string): string {
  return `E2E Org ${label} ${randomUUID().slice(0, 8)}`
}

export function uniqueSupportEmail(label: string): string {
  return `support.e2e.${label}.${randomUUID().slice(0, 8)}@example.com`
}

export function uniqueSettingsUrl(label: string): string {
  return `https://example.com/${label}-${randomUUID().slice(0, 8)}`
}
