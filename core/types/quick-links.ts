import type { QuickLinkStatus } from '../constants.ts'

export interface QuickLinkResponse {
  id: number
  title: string
  excerpt: string
  url: string
  status: QuickLinkStatus
  category: { id: number; name: string }
  postedBy: { name: string }
  createdAt: string
}

export interface QuickLinksFilterOption {
  value: string
  count: number
}

export interface QuickLinksFilterOptionsResponse {
  statuses?: QuickLinksFilterOption[]
  categories: QuickLinksFilterOption[]
}

export interface QuickLinksResponse {
  quickLinks: QuickLinkResponse[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  filterOptions: QuickLinksFilterOptionsResponse
}

export interface QuickLinksActiveResponse {
  quickLinks: QuickLinkResponse[]
}

export interface QuickLinkDetailResponse {
  quickLink: QuickLinkResponse
}
