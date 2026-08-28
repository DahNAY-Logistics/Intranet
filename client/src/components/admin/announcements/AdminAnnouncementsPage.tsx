import { Tag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { AnnouncementList, CategoriesDialog, CreateDialog, DeleteDialog, EditDialog, Filters } from '@/components/announcements'
import UsersPagination from '@/components/users/UsersPagination'
import { useAnnouncementsStore } from '@/stores/announcements-store'
import type { AnnouncementResponse, AnnouncementsResponse } from 'core/types/announcements'

export default function AdminAnnouncementsPage() {
  const page = useAnnouncementsStore((state) => state.page)
  const pageSize = useAnnouncementsStore((state) => state.pageSize)
  const statusFilter = useAnnouncementsStore((state) => state.statusFilter)
  const categoryFilter = useAnnouncementsStore((state) => state.categoryFilter)
  const sortOrder = useAnnouncementsStore((state) => state.sortOrder)
  const editingId = useAnnouncementsStore((state) => state.editingId)
  const setEditingId = useAnnouncementsStore((state) => state.setEditingId)
  const deleting = useAnnouncementsStore((state) => state.deleting)
  const setDeleting = useAnnouncementsStore((state) => state.setDeleting)
  const setCategoriesOpen = useAnnouncementsStore((state) => state.setCategoriesOpen)
  const setPage = useAnnouncementsStore((state) => state.setPage)
  const setPageSize = useAnnouncementsStore((state) => state.setPageSize)

  const announcements = useQuery({
    queryKey: ['announcements', { page, pageSize, statusFilter, categoryFilter, sortOrder }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<AnnouncementsResponse>('/announcements', {
        signal,
        params: {
          page,
          pageSize,
          status: statusFilter.length ? statusFilter.join(',') : undefined,
          categoryId: categoryFilter.length ? categoryFilter.join(',') : undefined,
          sortOrder,
        },
      })
      return data
    },
  })

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <h1 className="page-heading">Announcements</h1>
        <div className="header-actions">
          <Button type="button" variant="outline" onClick={() => setCategoriesOpen(true)}>
            <Tag />
            Categories
          </Button>
          <CreateDialog />
        </div>
      </div>

      <Filters filterOptions={announcements.data?.filterOptions} />

      {announcements.isError ? (
        <ErrorState error={announcements.error} fallback="Failed to load announcements." />
      ) : (
        <AnnouncementList
          announcements={announcements.data?.announcements ?? []}
          isLoading={announcements.isPending}
          onEdit={(announcement: AnnouncementResponse) => setEditingId(announcement.id)}
          onDelete={(announcement: AnnouncementResponse) => setDeleting(announcement)}
        />
      )}

      {announcements.isSuccess && announcements.data.totalCount > 0 && (
        <UsersPagination pagination={announcements.data} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <EditDialog id={editingId} onOpenChange={(open) => !open && setEditingId(null)} />

      <DeleteDialog announcement={deleting} onOpenChange={(open) => !open && setDeleting(null)} onDeleted={() => setDeleting(null)} />

      <CategoriesDialog />
    </div>
  )
}
