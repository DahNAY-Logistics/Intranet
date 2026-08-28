import { Tag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { CategoriesDialog, CreateDialog, DeleteDialog, EditDialog, EventList, Filters } from '@/components/events'
import UsersPagination from '@/components/users/UsersPagination'
import { useEventsStore } from '@/stores/events-store'
import type { EventResponse, EventsResponse } from 'core/types/events'

export default function AdminEventsPage() {
  const page = useEventsStore((state) => state.page)
  const pageSize = useEventsStore((state) => state.pageSize)
  const statusFilter = useEventsStore((state) => state.statusFilter)
  const categoryFilter = useEventsStore((state) => state.categoryFilter)
  const modeFilter = useEventsStore((state) => state.modeFilter)
  const sortOrder = useEventsStore((state) => state.sortOrder)
  const editingId = useEventsStore((state) => state.editingId)
  const setEditingId = useEventsStore((state) => state.setEditingId)
  const deleting = useEventsStore((state) => state.deleting)
  const setDeleting = useEventsStore((state) => state.setDeleting)
  const setCategoriesOpen = useEventsStore((state) => state.setCategoriesOpen)
  const setPage = useEventsStore((state) => state.setPage)
  const setPageSize = useEventsStore((state) => state.setPageSize)

  const events = useQuery({
    queryKey: ['events', { page, pageSize, statusFilter, categoryFilter, modeFilter, sortOrder }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<EventsResponse>('/events', {
        signal,
        params: {
          page,
          pageSize,
          status: statusFilter.length ? statusFilter.join(',') : undefined,
          categoryId: categoryFilter.length ? categoryFilter.join(',') : undefined,
          mode: modeFilter.length ? modeFilter.join(',') : undefined,
          sortOrder,
        },
      })
      return data
    },
  })

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <h1 className="page-heading">Events</h1>
        <div className="header-actions">
          <Button type="button" variant="outline" onClick={() => setCategoriesOpen(true)}>
            <Tag />
            Categories
          </Button>
          <CreateDialog />
        </div>
      </div>

      <Filters filterOptions={events.data?.filterOptions} />

      {events.isError ? (
        <ErrorState error={events.error} fallback="Failed to load events." />
      ) : (
        <EventList
          events={events.data?.events ?? []}
          isLoading={events.isPending}
          onEdit={(event: EventResponse) => setEditingId(event.id)}
          onDelete={(event: EventResponse) => setDeleting(event)}
        />
      )}

      {events.isSuccess && events.data.totalCount > 0 && (
        <UsersPagination pagination={events.data} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <EditDialog id={editingId} onOpenChange={(open) => !open && setEditingId(null)} />

      <DeleteDialog event={deleting} onOpenChange={(open) => !open && setDeleting(null)} onDeleted={() => setDeleting(null)} />

      <CategoriesDialog />
    </div>
  )
}
