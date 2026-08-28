import type { Locator, Page } from '@playwright/test'

export function listRowByTitle(page: Page, title: string): Locator {
  return page.getByRole('article').filter({ hasText: title })
}

export function listRowActionButtons(row: Locator): { editButton: Locator; deleteButton: Locator } {
  const buttons = row.getByRole('button')
  return { editButton: buttons.nth(0), deleteButton: buttons.nth(1) }
}
