import type { DashboardRange } from '../constants.ts'

export interface DashboardStatsResponse {
  publishedAnnouncements: number
  publishedEvents: number
  totalQuickLinks: number
  totalBanners: number
  totalResources: number
}

export interface MoodTrendPoint {
  date: string
  label: string
  axisLabel: string
  isTick: boolean
  VeryHappy: number
  Happy: number
  Neutral: number
  Sad: number
  VerySad: number
}

export interface MoodTrendResponse {
  range: DashboardRange
  data: MoodTrendPoint[]
}
