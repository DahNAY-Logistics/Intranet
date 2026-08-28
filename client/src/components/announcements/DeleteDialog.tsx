import DeleteEntityDialog from '@/components/shared/DeleteEntityDialog'
import { announcementMessages } from 'core/messages'
import type { AnnouncementResponse } from 'core/types/announcements'

type DeleteDialogProps = {
  announcement: AnnouncementResponse | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export default function DeleteDialog({ announcement, onOpenChange, onDeleted }: DeleteDialogProps) {
  return (
    <DeleteEntityDialog
      item={announcement}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      basePath="/announcements"
      invalidateKey={['announcements']}
      getTitle={(item) => item.title}
      successMessage={announcementMessages.DELETED}
      fallbackError="Failed to delete announcement."
      noItemLabel="this announcement"
    />
  )
}
