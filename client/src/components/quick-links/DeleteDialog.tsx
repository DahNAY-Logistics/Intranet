import DeleteEntityDialog from '@/components/shared/DeleteEntityDialog'
import { quickLinkMessages } from 'core/messages'
import type { QuickLinkResponse } from 'core/types/quick-links'

type DeleteDialogProps = {
  quickLink: QuickLinkResponse | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export default function DeleteDialog({ quickLink, onOpenChange, onDeleted }: DeleteDialogProps) {
  return (
    <DeleteEntityDialog
      item={quickLink}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      basePath="/quick-links"
      invalidateKey={['quick-links']}
      getTitle={(item) => item.title}
      successMessage={quickLinkMessages.DELETED}
      fallbackError="Failed to delete quick link."
      noItemLabel="this quick link"
    />
  )
}
