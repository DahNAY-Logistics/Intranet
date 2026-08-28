import { Tag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { CategoriesDialog, CreateDialog, DeleteDialog, EditDialog, Filters, ResourceList } from '@/components/resources'
import UsersPagination from '@/components/users/UsersPagination'
import { useResourcesStore } from '@/stores/resources-store'
import type { ResourceResponse, ResourcesResponse } from 'core/types/resources'

export default function AdminResourcesPage() {
  const page = useResourcesStore((state) => state.page)
  const pageSize = useResourcesStore((state) => state.pageSize)
  const statusFilter = useResourcesStore((state) => state.statusFilter)
  const categoryFilter = useResourcesStore((state) => state.categoryFilter)
  const sortOrder = useResourcesStore((state) => state.sortOrder)
  const editingId = useResourcesStore((state) => state.editingId)
  const setEditingId = useResourcesStore((state) => state.setEditingId)
  const deleting = useResourcesStore((state) => state.deleting)
  const setDeleting = useResourcesStore((state) => state.setDeleting)
  const setCategoriesOpen = useResourcesStore((state) => state.setCategoriesOpen)
  const setPage = useResourcesStore((state) => state.setPage)
  const setPageSize = useResourcesStore((state) => state.setPageSize)

  const resources = useQuery({
    queryKey: ['resources', { page, pageSize, statusFilter, categoryFilter, sortOrder }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<ResourcesResponse>('/resources', {
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
        <h1 className="page-heading">Resources</h1>
        <div className="header-actions">
          <Button type="button" variant="outline" onClick={() => setCategoriesOpen(true)}>
            <Tag />
            Categories
          </Button>
          <CreateDialog />
        </div>
      </div>

      <Filters filterOptions={resources.data?.filterOptions} />

      {resources.isError ? (
        <ErrorState error={resources.error} fallback="Failed to load resources." />
      ) : (
        <ResourceList
          resources={resources.data?.resources ?? []}
          isLoading={resources.isPending}
          onEdit={(resource: ResourceResponse) => setEditingId(resource.id)}
          onDelete={(resource: ResourceResponse) => setDeleting(resource)}
        />
      )}

      {resources.isSuccess && resources.data.totalCount > 0 && (
        <UsersPagination pagination={resources.data} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <EditDialog id={editingId} onOpenChange={(open) => !open && setEditingId(null)} />

      <DeleteDialog resource={deleting} onOpenChange={(open) => !open && setDeleting(null)} onDeleted={() => setDeleting(null)} />

      <CategoriesDialog />
    </div>
  )
}
