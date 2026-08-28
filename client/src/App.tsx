import * as Sentry from '@sentry/react'
import { Navigate, Route, Routes } from 'react-router'

import AdminRoute from '@/components/AdminRoute'
import { Cursor, CursorProvider } from '@/components/animate-ui/components/animate/cursor'
import { AnnouncementDetailPage, AnnouncementsPage } from '@/components/announcements'
import AppLayout from '@/components/AppLayout'
import { BlogDetailPage, BlogsPage } from '@/components/blogs'
import { DirectoryPage } from '@/components/directory'
import { EventDetailPage, EventsPage } from '@/components/events'
import HomePage from '@/components/HomePage'
import LandingPage from '@/components/LandingPage'
import MaintenanceGate from '@/components/MaintenanceGate'
import NavigationProgress from '@/components/NavigationProgress'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ResourceDetailPage, ResourcesPage } from '@/components/resources'
import {
  AdminAnnouncementDetailPage,
  AdminAnnouncementsPage,
  AdminBannerDetailPage,
  AdminBannersPage,
  AdminDashboardPage,
  AdminEventDetailPage,
  AdminEventsPage,
  AdminLayout,
  AdminQuickLinksPage,
  AdminResourceDetailPage,
  AdminResourcesPage,
  AdminSettingsPage,
  AdminUsersPage,
} from '@/components/admin'

const SentryRoutes = Sentry.wrapReactRouterRouting(Routes)

export default function App() {
  return (
    <>
      <NavigationProgress />

      <CursorProvider global>
        <Cursor />
      </CursorProvider>

      <SentryRoutes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MaintenanceGate />}>
            <Route element={<AppLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/:id" element={<ResourceDetailPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/blogs/:slug" element={<BlogDetailPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="banners" element={<AdminBannersPage />} />
                <Route path="banners/:id" element={<AdminBannerDetailPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="announcements/:id" element={<AdminAnnouncementDetailPage />} />
                <Route path="events" element={<AdminEventsPage />} />
                <Route path="events/:id" element={<AdminEventDetailPage />} />
                <Route path="quick-links" element={<AdminQuickLinksPage />} />
                <Route path="resources" element={<AdminResourcesPage />} />
                <Route path="resources/:id" element={<AdminResourceDetailPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </SentryRoutes>
    </>
  )
}
