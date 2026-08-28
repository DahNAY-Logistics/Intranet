import { Button } from '@/components/ui/button'
import type { UserListItem } from 'core/types/users'
import { roles, userStatuses } from 'core/constants'
import type { UserStatus } from 'core/constants'

type UsersBulkActionsBarProps = {
  selectedUsers: UserListItem[]
  statusFilter: UserStatus
  onEdit: (user: UserListItem) => void
  onStatusAction: () => void
  onClear: () => void
}

export default function UsersBulkActionsBar({ selectedUsers, statusFilter, onEdit, onStatusAction, onClear }: UsersBulkActionsBarProps) {
  const isActiveTab = statusFilter === userStatuses.active
  const hasAdminSelected = selectedUsers.some((user) => user.role === roles.admin)
  const statusActionDisabled = isActiveTab && hasAdminSelected

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>{selectedUsers.length} selected</span>
      <Button
        variant="outline"
        size="sm"
        disabled={selectedUsers.length !== 1}
        title={selectedUsers.length !== 1 ? 'Select exactly one user to edit' : undefined}
        onClick={() => selectedUsers.length === 1 && onEdit(selectedUsers[0])}
      >
        Edit
      </Button>
      <Button
        variant={isActiveTab ? 'destructive' : 'outline'}
        size="sm"
        disabled={statusActionDisabled}
        title={statusActionDisabled ? 'Admin users cannot be deactivated' : undefined}
        onClick={onStatusAction}
      >
        {isActiveTab ? 'Deactivate' : 'Reactivate'}
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear selection
      </Button>
    </div>
  )
}
