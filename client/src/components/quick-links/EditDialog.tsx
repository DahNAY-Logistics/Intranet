import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import EditEntityDialog from '@/components/shared/EditEntityDialog'
import SkeletonFieldRow from '@/components/shared/SkeletonFieldRow'
import type { QuickLinkDetailResponse, QuickLinkResponse } from 'core/types/quick-links'

import QuickLinkForm from './QuickLinkForm'

type EditDialogProps = {
  id: number | null
  onOpenChange: (open: boolean) => void
}

const loadingSkeleton = (
  <div className="space-y-4">
    <Skeleton className="skeleton-input" />
    <Skeleton className="skeleton-textarea" />
    <Skeleton className="skeleton-input" />
    <SkeletonFieldRow height="h-8" />
  </div>
)

export default function EditDialog({ id, onOpenChange }: EditDialogProps) {
  return (
    <EditEntityDialog<QuickLinkResponse>
      id={id}
      onOpenChange={onOpenChange}
      queryKey={['quick-links', id]}
      queryFn={async (signal) => {
        const { data } = await api.get<QuickLinkDetailResponse>(`/quick-links/${id}`, { signal })
        return data.quickLink
      }}
      title="Edit Quick Link"
      fallbackError="Failed to load quick link."
      loadingSkeleton={loadingSkeleton}
    >
      {(quickLink, onSuccess) => <QuickLinkForm key={quickLink.id} quickLink={quickLink} onSuccess={onSuccess} />}
    </EditEntityDialog>
  )
}
