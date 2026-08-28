import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import EditEntityDialog from '@/components/shared/EditEntityDialog'
import SkeletonFieldRow from '@/components/shared/SkeletonFieldRow'
import type { BannerDetailResponse, BannerResponse } from 'core/types/banners'

import BannerForm from './BannerForm'

type EditDialogProps = {
  id: number | null
  onOpenChange: (open: boolean) => void
}

const loadingSkeleton = (
  <div className="space-y-4">
    <Skeleton className="skeleton-input" />
    <Skeleton className="skeleton-textarea" />
    <SkeletonFieldRow height="h-8" />
    <Skeleton className="h-32 w-full" />
  </div>
)

export default function EditDialog({ id, onOpenChange }: EditDialogProps) {
  return (
    <EditEntityDialog<BannerResponse>
      id={id}
      onOpenChange={onOpenChange}
      queryKey={['banners', id]}
      queryFn={async (signal) => {
        const { data } = await api.get<BannerDetailResponse>(`/banners/${id}`, { signal })
        return data.banner
      }}
      title="Edit Banner"
      fallbackError="Failed to load banner."
      loadingSkeleton={loadingSkeleton}
    >
      {(banner, onSuccess) => <BannerForm key={banner.id} banner={banner} onSuccess={onSuccess} />}
    </EditEntityDialog>
  )
}
