import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorAlert from '@/components/ErrorAlert'
import SkeletonFieldRow from '@/components/shared/SkeletonFieldRow'
import type { UserDetail, UserListItem } from 'core/types/users'

import UserForm from './UserForm'

type EditUserDialogProps = {
  user: UserListItem | null
  onOpenChange: (open: boolean) => void
}

export default function EditUserDialog({ user, onOpenChange }: EditUserDialogProps) {
  const userDetail = useQuery({
    queryKey: ['users', user?.id],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<UserDetail>(`/users/${user!.id}`, { signal })
      return data
    },
    enabled: user !== null,
  })

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>{`Update ${user?.name ?? 'this user'}'s details.`}</DialogDescription>
        </DialogHeader>

        {userDetail.isPending && (
          <div className="space-y-4">
            <Skeleton className="skeleton-input" />
            <Skeleton className="skeleton-input" />
            <SkeletonFieldRow />
            <SkeletonFieldRow />
          </div>
        )}

        {userDetail.isError && <ErrorAlert error={userDetail.error} fallback="Failed to load user." />}

        {userDetail.isSuccess && (
          <UserForm key={userDetail.data.id} user={userDetail.data} onSuccess={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
