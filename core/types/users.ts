import type { Role, UserStatus } from '../constants.ts'

// Types for the users API responses

export interface UserSummary {
  id: string
  name: string
  email: string
  role: Role
  employeeId: string | null
}

export interface MeResponse extends UserSummary {
  image: string | null
}

export interface UserLookupRef {
  id: number
  name: string
}

export interface UserListItem extends UserSummary {
  status: UserStatus
  department: UserLookupRef | null
  designation: UserLookupRef | null
  location: UserLookupRef | null
  joinedDate: string | null
}

export interface UserDetail extends UserListItem {
  dob: string | null
  reportedTo: { id: string; name: string } | null
}

// Types for the users query parameters

export interface UsersFilterOption {
  value: string
  label?: string
  count: number
}

export interface UsersFilterOptionsResponse {
  roles: UsersFilterOption[]
  departments: UsersFilterOption[]
  designations: UsersFilterOption[]
  locations: UsersFilterOption[]
}

export interface UsersResponse {
  users: UserListItem[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  filterOptions: UsersFilterOptionsResponse
}

// Types for the users lookup endpoint (Reported To picker)

export interface UserLookupItem {
  id: string
  name: string
  employeeId: string | null
}

export interface UsersLookupResponse {
  users: UserLookupItem[]
}
