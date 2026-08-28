import type { AnnouncementStatus } from '../constants.ts'

export interface AnnouncementResponse {
  id: number
  title: string
  excerpt: string
  status: AnnouncementStatus
  category: { id: number; name: string }
  postedBy: { name: string }
  createdAt: string
}

export interface AnnouncementsFilterOption {
  value: string
  count: number
}

export interface AnnouncementsFilterOptionsResponse {
  statuses?: AnnouncementsFilterOption[]
  categories: AnnouncementsFilterOption[]
}

export interface AnnouncementsResponse {
  announcements: AnnouncementResponse[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  filterOptions: AnnouncementsFilterOptionsResponse
}

export interface AnnouncementsActiveResponse {
  announcements: AnnouncementResponse[]
}

export interface AnnouncementDetailResponse {
  announcement: AnnouncementResponse
}
