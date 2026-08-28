import type { Page } from '@playwright/test'

export async function widenFeedPageSize(page: Page, apiPath: string, pageSize = 50): Promise<void> {
  await page.route(`**${apiPath}?*`, async (route) => {
    const url = new URL(route.request().url())
    url.searchParams.set('pageSize', String(pageSize))
    await route.continue({ url: url.toString() })
  })
}
