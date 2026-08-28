import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import EditEntityDialog from '@/components/shared/EditEntityDialog'
import SkeletonFieldRow from '@/components/shared/SkeletonFieldRow'
import type { ResourceDetailResponse, ResourceResponse } from 'core/types/resources'

import ResourceForm from './ResourceForm'

type EditDialogProps = {
  id: number | null
  onOpenChange: (open: boolean) => void
}

const loadingSkeleton = (
  <div className="space-y-4">
    <Skeleton className="skeleton-input" />
    <Skeleton className="skeleton-textarea" />
    <SkeletonFieldRow height="h-8" />
    <Skeleton className="skeleton-input" />
    <Skeleton className="h-40 w-full" />
  </div>
)

export default function EditDialog({ id, onOpenChange }: EditDialogProps) {
  return (
    <EditEntityDialog<ResourceResponse>
      id={id}
      onOpenChange={onOpenChange}
      queryKey={['resources', id]}
      queryFn={async (signal) => {
        const { data } = await api.get<ResourceDetailResponse>(`/resources/${id}`, { signal })
        return data.resource
      }}
      title="Edit Resource"
      fallbackError="Failed to load resource."
      loadingSkeleton={loadingSkeleton}
    >
      {(resource, onSuccess) => <ResourceForm key={resource.id} resource={resource} onSuccess={onSuccess} />}
    </EditEntityDialog>
  )
}
