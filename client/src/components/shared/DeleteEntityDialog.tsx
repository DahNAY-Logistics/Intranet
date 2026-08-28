import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ErrorAlert from '@/components/ErrorAlert'

type DeleteEntityDialogProps<T extends { id: number }> = {
  item: T | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  basePath: string
  invalidateKey: unknown[]
  getTitle: (item: T) => string
  successMessage: (title: string) => string
  fallbackError: string
  noItemLabel: string
}

export default function DeleteEntityDialog<T extends { id: number }>({
  item,
  onOpenChange,
  onDeleted,
  basePath,
  invalidateKey,
  getTitle,
  successMessage,
  fallbackError,
  noItemLabel,
}: DeleteEntityDialogProps<T>) {
  const queryClient = useQueryClient()

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${basePath}/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
      toast.success(successMessage(getTitle(item!)))
      onDeleted()
      onOpenChange(false)
    },
  })

  return (
    <AlertDialog open={item !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete "${item ? getTitle(item) : noItemLabel}"?`}</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>

        {deleteItem.isError && <ErrorAlert error={deleteItem.error} fallback={fallbackError} />}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteItem.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteItem.isPending}
            onClick={() => deleteItem.mutate(item!.id)}
          >
            {deleteItem.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
