import type { UserDetail, UsersResponse } from 'core/types/users'
import type { CategoriesResponse } from 'core/types/categories'

export function makeUsersResponse(overrides: Partial<UsersResponse> = {}): UsersResponse {
  return {
    users: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    filterOptions: { roles: [], departments: [], designations: [], locations: [] },
    ...overrides,
  }
}

export function makeUserDetail(overrides: Partial<UserDetail> = {}): UserDetail {
  return {
    id: '1',
    employeeId: 'EMP001',
    name: 'Jane Doe',
    email: 'jane@dahnay.com',
    role: 'User',
    status: 'Active',
    department: null,
    designation: null,
    location: null,
    dob: null,
    joinedDate: null,
    reportedTo: null,
    ...overrides,
  }
}

export function makeCategoriesResponse(
  categories: CategoriesResponse['categories'] = [
    { id: 1, name: 'Engineering', createdAt: '2026-01-01T00:00:00.000Z', count: 0 },
  ],
): CategoriesResponse {
  return { categories }
}
