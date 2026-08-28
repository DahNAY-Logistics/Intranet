import { createHmac, randomUUID } from 'node:crypto'
import type { BrowserContext } from '@playwright/test'

import { testEnv } from '../test-env.js'
import { withDb } from './db.js'

const SESSION_COOKIE_NAME = 'better-auth.session_token'
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000

function signSessionToken(token: string): string {
  const signature = createHmac('sha256', testEnv.BETTER_AUTH_SECRET).update(token).digest('base64')
  return `${token}.${signature}`
}

export async function signInAsUserId(context: BrowserContext, userId: string): Promise<void> {
  const token = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS)

  await withDb((client) =>
    client.query(
      'insert into "session" (id, token, "userId", "expiresAt", "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $6)',
      [randomUUID(), token, userId, expiresAt, now, now],
    ),
  )

  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: encodeURIComponent(signSessionToken(token)),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}
