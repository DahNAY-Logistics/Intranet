import type { UserLookupRef } from './users.ts'

export interface DirectoryEntry {
  id: string
  name: string
  email: string
  image: string | null
  employeeId: string | null
  reportedTo: { id: string; name: string } | null
  department: UserLookupRef | null
  designation: UserLookupRef | null
  location: UserLookupRef | null
  joinedDate: string | null
}

export interface DirectoryFilterOption {
  value: string
  label?: string
  count: number
}

export interface DirectoryFilterOptionsResponse {
  departments: DirectoryFilterOption[]
  designations: DirectoryFilterOption[]
  locations: DirectoryFilterOption[]
}

export interface DirectoryResponse {
  entries: DirectoryEntry[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  filterOptions: DirectoryFilterOptionsResponse
}
