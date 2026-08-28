import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { rowSelectionFeature, rowSortingFeature, tableFeatures } from '@tanstack/react-table'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { initials } from '@/lib/utils'
import type { UserListItem } from 'core/types/users'
import { roles } from 'core/constants'

import UsersColumnHeader from './UsersColumnHeader'

export const features = tableFeatures({ rowSortingFeature, rowSelectionFeature })

export const columns: ColumnDef<typeof features, UserListItem>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
        aria-label="Select all users on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
        aria-label={`Select ${row.original.name}`}
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'employeeId',
    header: ({ column }) => <UsersColumnHeader column={column} title="Employee ID" />,
    cell: (info) => info.getValue() ?? '—',
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <UsersColumnHeader column={column} title="User" />,
    enableSorting: false,
    cell: (info) => {
      const user = info.row.original
      return (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <UsersColumnHeader column={column} title="Role" />,
    enableSorting: false,
    cell: (info) => (
      <Badge variant={info.row.original.role === roles.admin ? 'default' : 'secondary'}>
        {info.row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: 'department',
    header: ({ column }) => <UsersColumnHeader column={column} title="Department" />,
    enableSorting: false,
    cell: (info) => (
      <span className="text-muted-foreground">{info.row.original.department?.name ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'designation',
    header: ({ column }) => <UsersColumnHeader column={column} title="Designation" />,
    enableSorting: false,
    cell: (info) => (
      <span className="text-muted-foreground">{info.row.original.designation?.name ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'location',
    header: ({ column }) => <UsersColumnHeader column={column} title="Location" />,
    enableSorting: false,
    cell: (info) => (
      <span className="text-muted-foreground">{info.row.original.location?.name ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'joinedDate',
    header: ({ column }) => <UsersColumnHeader column={column} title="Joined" />,
    cell: (info) => {
      const joinedDate = info.row.original.joinedDate
      return (
        <span className="text-muted-foreground">
          {joinedDate ? format(new Date(joinedDate), 'MMM d, yyyy') : '—'}
        </span>
      )
    },
  },
]
