import DeleteEntityDialog from '@/components/shared/DeleteEntityDialog'
import { resourceMessages } from 'core/messages'
import type { ResourceResponse } from 'core/types/resources'

type DeleteDialogProps = {
  resource: ResourceResponse | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export default function DeleteDialog({ resource, onOpenChange, onDeleted }: DeleteDialogProps) {
  return (
    <DeleteEntityDialog
      item={resource}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      basePath="/resources"
      invalidateKey={['resources']}
      getTitle={(item) => item.title}
      successMessage={resourceMessages.DELETED}
      fallbackError="Failed to delete resource."
      noItemLabel="this resource"
    />
  )
}
