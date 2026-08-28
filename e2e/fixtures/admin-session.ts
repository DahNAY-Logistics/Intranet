import type { BrowserContext } from '@playwright/test'

import { testEnv } from '../test-env.js'
import { withDb } from './db.js'
import { signInAsUserId } from './session.js'

export async function getSeedAdminId(): Promise<string> {
  return withDb(async (client) => {
    const admin = await client.query<{ id: string }>('select id from "user" where email = $1', [
      testEnv.SEED_ADMIN_EMAIL,
    ])
    const id = admin.rows[0]?.id
    if (!id) {
      throw new Error(
        `Seed admin ${testEnv.SEED_ADMIN_EMAIL} was not found in intranet_test — did the API web server's reset+seed chain run?`,
      )
    }
    return id
  })
}

export async function signInAsAdmin(context: BrowserContext): Promise<void> {
  const adminId = await getSeedAdminId()
  await signInAsUserId(context, adminId)
}
