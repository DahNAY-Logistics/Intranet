import { randomUUID } from 'node:crypto'

export function uniqueEventTitle(label: string): string {
  return `E2E Event ${label} ${randomUUID().slice(0, 8)}`
}

export function uniqueEventCategoryName(label: string): string {
  return `Ev ${label} ${randomUUID().slice(0, 6)}`
}
