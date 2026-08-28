import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import EditEntityDialog from '@/components/shared/EditEntityDialog'
import SkeletonFieldRow from '@/components/shared/SkeletonFieldRow'
import type { AnnouncementDetailResponse, AnnouncementResponse } from 'core/types/announcements'

import AnnouncementForm from './AnnouncementForm'

type EditDialogProps = {
  id: number | null
  onOpenChange: (open: boolean) => void
}

const loadingSkeleton = (
  <div className="space-y-4">
    <Skeleton className="skeleton-input" />
    <Skeleton className="skeleton-textarea" />
    <SkeletonFieldRow height="h-8" />
  </div>
)

export default function EditDialog({ id, onOpenChange }: EditDialogProps) {
  return (
    <EditEntityDialog<AnnouncementResponse>
      id={id}
      onOpenChange={onOpenChange}
      queryKey={['announcements', id]}
      queryFn={async (signal) => {
        const { data } = await api.get<AnnouncementDetailResponse>(`/announcements/${id}`, { signal })
        return data.announcement
      }}
      title="Edit Announcement"
      fallbackError="Failed to load announcement."
      loadingSkeleton={loadingSkeleton}
    >
      {(announcement, onSuccess) => (
        <AnnouncementForm key={announcement.id} announcement={announcement} onSuccess={onSuccess} />
      )}
    </EditEntityDialog>
  )
}
