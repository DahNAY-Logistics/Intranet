import { Client } from 'pg'

import { testEnv } from '../test-env.js'

export async function withDb<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: testEnv.DATABASE_URL })
  await client.connect()
  try {
    return await run(client)
  } finally {
    await client.end()
  }
}
