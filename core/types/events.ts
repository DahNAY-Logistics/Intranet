import type { EventMode, EventStatus } from '../constants.ts'

export interface EventResponse {
  id: number
  title: string
  excerpt: string
  status: EventStatus
  mode: EventMode
  location: string
  startDate: string
  endDate: string
  category: { id: number; name: string }
  postedBy: { name: string }
  createdAt: string
}

export interface EventsFilterOption {
  value: string
  count: number
}

export interface EventsFilterOptionsResponse {
  statuses?: EventsFilterOption[]
  categories: EventsFilterOption[]
  modes: EventsFilterOption[]
}

export interface EventsResponse {
  events: EventResponse[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  filterOptions: EventsFilterOptionsResponse
}

export interface EventsActiveResponse {
  events: EventResponse[]
}

export interface EventDetailResponse {
  event: EventResponse
}
