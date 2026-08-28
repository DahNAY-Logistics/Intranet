import DeleteEntityDialog from '@/components/shared/DeleteEntityDialog'
import { eventMessages } from 'core/messages'
import type { EventResponse } from 'core/types/events'

type DeleteDialogProps = {
  event: EventResponse | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export default function DeleteDialog({ event, onOpenChange, onDeleted }: DeleteDialogProps) {
  return (
    <DeleteEntityDialog
      item={event}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      basePath="/events"
      invalidateKey={['events']}
      getTitle={(item) => item.title}
      successMessage={eventMessages.DELETED}
      fallbackError="Failed to delete event."
      noItemLabel="this event"
    />
  )
}
