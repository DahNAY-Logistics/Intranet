import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import EditEntityDialog from '@/components/shared/EditEntityDialog'
import SkeletonFieldRow from '@/components/shared/SkeletonFieldRow'
import type { EventDetailResponse, EventResponse } from 'core/types/events'

import EventForm from './EventForm'

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
    <EditEntityDialog<EventResponse>
      id={id}
      onOpenChange={onOpenChange}
      queryKey={['events', id]}
      queryFn={async (signal) => {
        const { data } = await api.get<EventDetailResponse>(`/events/${id}`, { signal })
        return data.event
      }}
      title="Edit Event"
      fallbackError="Failed to load event."
      loadingSkeleton={loadingSkeleton}
    >
      {(event, onSuccess) => <EventForm key={event.id} event={event} onSuccess={onSuccess} />}
    </EditEntityDialog>
  )
}
