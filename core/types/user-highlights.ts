import type { UserLookupRef } from './users.ts'

export interface BirthdayEntry {
  id: string
  name: string
  department: UserLookupRef | null
  day: number
  month: number
}

export interface RecentlyJoinedEntry {
  id: string
  name: string
  department: UserLookupRef | null
  joinedDate: string
}

export interface BirthdaysResponse {
  birthdays: BirthdayEntry[]
}

export interface RecentlyJoinedResponse {
  recentlyJoined: RecentlyJoinedEntry[]
}
