import { randomUUID } from 'node:crypto'
import type { BrowserContext } from '@playwright/test'

import { withDb } from './db.js'
import { signInAsUserId } from './session.js'
import { uniqueUser } from './user-data.js'
import type { UniqueUser } from './user-data.js'

export async function signInAsRegularUser(context: BrowserContext, label: string): Promise<UniqueUser & { id: string }> {
  const user = uniqueUser(label)
  const id = randomUUID()
  const now = new Date()

  await withDb((client) =>
    client.query(
      'insert into "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt") values ($1, $2, $3, false, $4, $5, $5)',
      [id, user.name, user.email, 'User', now],
    ),
  )

  await signInAsUserId(context, id)
  return { ...user, id }
}
