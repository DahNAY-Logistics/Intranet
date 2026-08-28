import type { BannerStatus } from '../constants.ts'

export interface BannerResponse {
  id: number
  title: string
  excerpt: string
  status: BannerStatus
  displayOrder: number
  startDate: string
  endDate: string
  category: { id: number; name: string }
  postedBy: { name: string }
  attachment: { id: number; url: string }
  createdAt: string
}

export interface BannersResponse {
  banners: BannerResponse[]
}

export interface BannerDetailResponse {
  banner: BannerResponse
}
