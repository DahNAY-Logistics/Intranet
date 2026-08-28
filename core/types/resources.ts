import type { ResourceStatus } from '../constants.ts'

export interface ResourceResponse {
  id: number
  title: string
  excerpt: string
  content: string
  url: string | null
  status: ResourceStatus
  category: { id: number; name: string }
  postedBy: { name: string }
  createdAt: string
}

export interface ResourcesFilterOption {
  value: string
  count: number
}

export interface ResourcesFilterOptionsResponse {
  statuses?: ResourcesFilterOption[]
  categories: ResourcesFilterOption[]
}

export interface ResourcesResponse {
  resources: ResourceResponse[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  filterOptions: ResourcesFilterOptionsResponse
}

export interface ResourceDetailResponse {
  resource: ResourceResponse
}
