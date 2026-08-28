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
import type { UserListItem } from 'core/types/users'

const MAX_NAMES = 5

type DeactivateUsersDialogProps = {
  selectedUsers: UserListItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeactivated: () => void
}

export default function DeactivateUsersDialog({ selectedUsers, open, onOpenChange, onDeactivated }: DeactivateUsersDialogProps) {
  const queryClient = useQueryClient()

  const deactivateUsers = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.patch<{ message: string }>('/users/deactivate', { ids })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(data.message)
      onDeactivated()
      onOpenChange(false)
    },
  })

  const names = selectedUsers.map((user) => user.name)
  const shown = names.slice(0, MAX_NAMES).join(', ')
  const remaining = names.length - MAX_NAMES
  const namesText = remaining > 0 ? `${shown}, +${remaining} more` : shown

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) deactivateUsers.reset()
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Deactivate ${selectedUsers.length} user${selectedUsers.length === 1 ? '' : 's'}: ${namesText}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            They will no longer be able to sign in. You can reactivate them from the Inactive tab.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deactivateUsers.isError && <ErrorAlert error={deactivateUsers.error} fallback="Failed to deactivate users." />}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivateUsers.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deactivateUsers.isPending}
            onClick={() => deactivateUsers.mutate(selectedUsers.map((user) => user.id))}
          >
            {deactivateUsers.isPending ? 'Deactivating…' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
