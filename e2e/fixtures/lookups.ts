import { randomUUID } from 'node:crypto'
import type { APIRequestContext } from '@playwright/test'

export type LookupKind = 'Department' | 'Designation' | 'Location'

const lookupBasePaths: Record<LookupKind, string> = {
  Department: '/api/users/departments',
  Designation: '/api/users/designations',
  Location: '/api/users/locations',
}

export function lookupBasePath(kind: LookupKind): string {
  return lookupBasePaths[kind]
}

export function uniqueLookupName(kind: LookupKind): string {
  return `${kind.slice(0, 4)}-${randomUUID().slice(0, 10)}`
}

interface LookupListItem {
  id: number
  name: string
}

export async function createLookupViaApi(
  request: APIRequestContext,
  kind: LookupKind,
  name: string,
): Promise<number> {
  const basePath = lookupBasePath(kind)

  const createResponse = await request.post(basePath, { data: { name } })
  if (createResponse.status() !== 201) {
    throw new Error(
      `Expected 201 creating ${kind} ${name}, got ${createResponse.status()}: ${await createResponse.text()}`,
    )
  }

  const listResponse = await request.get(basePath)
  if (listResponse.status() !== 200) {
    throw new Error(
      `Expected 200 listing ${kind}s after creating ${name}, got ${listResponse.status()}: ${await listResponse.text()}`,
    )
  }
  const body: { categories: LookupListItem[] } = await listResponse.json()
  const match = body.categories.find((category) => category.name === name)
  if (!match) {
    throw new Error(`${kind} ${name} was not found in the list after creation`)
  }
  return match.id
}
