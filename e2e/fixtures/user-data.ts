import { randomUUID } from 'node:crypto'
import type { APIRequestContext } from '@playwright/test'

export interface UniqueUser {
  name: string
  email: string
  employeeId: string
}

export function uniqueUser(label: string): UniqueUser {
  const suffix = randomUUID().slice(0, 8)
  return {
    name: `E2E ${label} ${suffix}`,
    email: `e2e.${label}.${suffix}@dahnay.com`,
    employeeId: `E2E-${label}-${suffix}`.toUpperCase(),
  }
}

export interface CreateUserOptions {
  departmentId: number
  designationId: number
  locationId: number
  joinedDate?: Date
}

export async function createUserViaApi(
  request: APIRequestContext,
  label: string,
  options: CreateUserOptions,
): Promise<UniqueUser> {
  const user = uniqueUser(label)

  const response = await request.post('/api/users', {
    data: {
      name: user.name,
      email: user.email,
      role: 'User',
      employeeId: user.employeeId,
      departmentId: options.departmentId,
      designationId: options.designationId,
      locationId: options.locationId,
      dob: '1990-01-01T00:00:00.000Z',
      joinedDate: (options.joinedDate ?? new Date()).toISOString(),
    },
  })
  if (response.status() !== 201) {
    throw new Error(`Expected 201 creating user ${user.email}, got ${response.status()}: ${await response.text()}`)
  }

  return user
}
