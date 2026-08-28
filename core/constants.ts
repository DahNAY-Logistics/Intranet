export const roles = {
  user: 'User',
  admin: 'Admin',
} as const

export type Role = (typeof roles)[keyof typeof roles]

export const apiStatusLabels = {
  ok: 'Online',
  down: 'Offline',
} as const

export const environment = {
  development: 'development',
  production: 'production',
} as const

export const bannerStatuses = {
  published: 'Published',
  archived: 'Archived',
} as const

export type BannerStatus = (typeof bannerStatuses)[keyof typeof bannerStatuses]

export const attachmentLimits = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const

export const bannerImageConstraints = {
  minWidthPx: 800,
  minAspectRatio: 1.5,
} as const

export const announcementStatuses = {
  published: 'Published',
  archived: 'Archived',
} as const

export type AnnouncementStatus = (typeof announcementStatuses)[keyof typeof announcementStatuses]

export const userStatuses = {
  active: 'Active',
  inactive: 'Inactive',
} as const

export type UserStatus = (typeof userStatuses)[keyof typeof userStatuses]

export const eventStatuses = {
  published: 'Published',
  archived: 'Archived',
} as const

export type EventStatus = (typeof eventStatuses)[keyof typeof eventStatuses]

export const eventModes = {
  online: 'Online',
  offline: 'Offline',
  hybrid: 'Hybrid',
} as const

export type EventMode = (typeof eventModes)[keyof typeof eventModes]

export const quickLinkStatuses = {
  published: 'Published',
  archived: 'Archived',
} as const

export type QuickLinkStatus = (typeof quickLinkStatuses)[keyof typeof quickLinkStatuses]

export const resourceStatuses = {
  published: 'Published',
  archived: 'Archived',
} as const

export type ResourceStatus = (typeof resourceStatuses)[keyof typeof resourceStatuses]

export const moods = {
  veryHappy: 'VeryHappy',
  happy: 'Happy',
  neutral: 'Neutral',
  sad: 'Sad',
  verySad: 'VerySad',
} as const

export type Mood = (typeof moods)[keyof typeof moods]

export const dashboardRanges = {
  weekly: 'weekly',
  monthly: 'monthly',
} as const

export type DashboardRange = (typeof dashboardRanges)[keyof typeof dashboardRanges]
