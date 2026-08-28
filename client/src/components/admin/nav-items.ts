import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  CalendarDays,
  GalleryHorizontal,
  LayoutDashboard,
  Link2,
  Megaphone,
  Settings,
  Users,
} from 'lucide-react'

export type AdminNavItem = {
  label: string
  path: string
  icon: LucideIcon
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Events', path: '/admin/events', icon: CalendarDays },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Banners', path: '/admin/banners', icon: GalleryHorizontal },
  { label: 'Quick Links', path: '/admin/quick-links', icon: Link2 },
  { label: 'Resources', path: '/admin/resources', icon: BookOpen },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]
