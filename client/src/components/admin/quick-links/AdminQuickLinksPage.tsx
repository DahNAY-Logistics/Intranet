import { Tag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { CategoriesDialog, CreateDialog, DeleteDialog, EditDialog, Filters, QuickLinkList } from '@/components/quick-links'
import UsersPagination from '@/components/users/UsersPagination'
import { useQuickLinksStore } from '@/stores/quick-links-store'
import type { QuickLinkResponse, QuickLinksResponse } from 'core/types/quick-links'

export default function AdminQuickLinksPage() {
  const page = useQuickLinksStore((state) => state.page)
  const pageSize = useQuickLinksStore((state) => state.pageSize)
  const statusFilter = useQuickLinksStore((state) => state.statusFilter)
  const categoryFilter = useQuickLinksStore((state) => state.categoryFilter)
  const sortOrder = useQuickLinksStore((state) => state.sortOrder)
  const editingId = useQuickLinksStore((state) => state.editingId)
  const setEditingId = useQuickLinksStore((state) => state.setEditingId)
  const deleting = useQuickLinksStore((state) => state.deleting)
  const setDeleting = useQuickLinksStore((state) => state.setDeleting)
  const setCategoriesOpen = useQuickLinksStore((state) => state.setCategoriesOpen)
  const setPage = useQuickLinksStore((state) => state.setPage)
  const setPageSize = useQuickLinksStore((state) => state.setPageSize)

  const quickLinks = useQuery({
    queryKey: ['quick-links', { page, pageSize, statusFilter, categoryFilter, sortOrder }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<QuickLinksResponse>('/quick-links', {
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
        <h1 className="page-heading">Quick Links</h1>
        <div className="header-actions">
          <Button type="button" variant="outline" onClick={() => setCategoriesOpen(true)}>
            <Tag />
            Categories
          </Button>
          <CreateDialog />
        </div>
      </div>

      <Filters filterOptions={quickLinks.data?.filterOptions} />

      {quickLinks.isError ? (
        <ErrorState error={quickLinks.error} fallback="Failed to load quick links." />
      ) : (
        <QuickLinkList
          quickLinks={quickLinks.data?.quickLinks ?? []}
          isLoading={quickLinks.isPending}
          onEdit={(quickLink: QuickLinkResponse) => setEditingId(quickLink.id)}
          onDelete={(quickLink: QuickLinkResponse) => setDeleting(quickLink)}
        />
      )}

      {quickLinks.isSuccess && quickLinks.data.totalCount > 0 && (
        <UsersPagination pagination={quickLinks.data} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <EditDialog id={editingId} onOpenChange={(open) => !open && setEditingId(null)} />

      <DeleteDialog quickLink={deleting} onOpenChange={(open) => !open && setDeleting(null)} onDeleted={() => setDeleting(null)} />

      <CategoriesDialog />
    </div>
  )
}
