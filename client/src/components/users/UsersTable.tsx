import { useEffect, useState } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import { useTable } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/get-error-message'
import { cn } from '@/lib/utils'
import { useUsersTableStore } from '@/stores/users-table-store'
import { EmptyState, ErrorState } from '@/components/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { userStatuses } from 'core/constants'
import type { UserListItem, UsersResponse } from 'core/types/users'

import { columns, features } from './columns'
import DeactivateUsersDialog from './DeactivateUsersDialog'
import EditUserDialog from './EditUserDialog'
import UsersBulkActionsBar from './UsersBulkActionsBar'
import UsersPagination from './UsersPagination'
import UsersToolbar from './UsersToolbar'

const MOBILE_HIDDEN_COLUMNS = new Set(['department', 'designation', 'location', 'joinedDate'])

export default function UsersTable() {
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false)

  const page = useUsersTableStore((state) => state.page)
  const pageSize = useUsersTableStore((state) => state.pageSize)
  const search = useUsersTableStore((state) => state.search)
  const sorting = useUsersTableStore((state) => state.sorting)
  const statusFilter = useUsersTableStore((state) => state.statusFilter)
  const roleFilter = useUsersTableStore((state) => state.roleFilter)
  const departmentFilter = useUsersTableStore((state) => state.departmentFilter)
  const designationFilter = useUsersTableStore((state) => state.designationFilter)
  const locationFilter = useUsersTableStore((state) => state.locationFilter)
  const setPage = useUsersTableStore((state) => state.setPage)
  const setPageSize = useUsersTableStore((state) => state.setPageSize)
  const setSorting = useUsersTableStore((state) => state.setSorting)

  const sortBy = sorting[0]?.id ?? 'employeeId'
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'

  useEffect(() => {
    setRowSelection({})
  }, [page, pageSize, sortBy, sortOrder, statusFilter, roleFilter, departmentFilter, designationFilter, locationFilter])

  const users = useQuery({
    queryKey: [
      'users',
      { page, pageSize, search, sortBy, sortOrder, statusFilter, roleFilter, departmentFilter, designationFilter, locationFilter },
    ],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<UsersResponse>('/users', {
        signal,
        params: {
          page,
          pageSize,
          search: search || undefined,
          sortBy,
          sortOrder,
          status: statusFilter,
          role: roleFilter.length ? roleFilter.join(',') : undefined,
          department: departmentFilter.length ? departmentFilter.join(',') : undefined,
          designation: designationFilter.length ? designationFilter.join(',') : undefined,
          location: locationFilter.length ? locationFilter.join(',') : undefined,
        },
      })
      return data
    },
  })

  const table = useTable({
    features,
    columns,
    data: users.data?.users ?? [],
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    manualSorting: true,
    getRowId: (row) => row.id,
  })

  const selectedUsers = table.getSelectedRowModel().rows.map((row) => row.original)
  const queryClient = useQueryClient()

  const handleStatusChanged = () => {
    setRowSelection({})
    if (selectedUsers.length === (users.data?.users.length ?? 0) && page > 1) setPage(page - 1)
  }

  const reactivateUsers = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.patch<{ message: string }>('/users/reactivate', { ids })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(data.message)
      handleStatusChanged()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to reactivate users.'))
    },
  })

  return (
    <div className="stack-4">
      <UsersToolbar filterOptions={users.data?.filterOptions} />
      {selectedUsers.length > 0 && (
        <UsersBulkActionsBar
          selectedUsers={selectedUsers}
          statusFilter={statusFilter}
          onEdit={setEditingUser}
          onStatusAction={() => {
            if (statusFilter === userStatuses.active) {
              setConfirmingDeactivate(true)
            } else {
              reactivateUsers.mutate(selectedUsers.map((user) => user.id))
            }
          }}
          onClear={() => setRowSelection({})}
        />
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(MOBILE_HIDDEN_COLUMNS.has(header.column.id) && 'table-cell-optional')}
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {users.isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-6 shrink-0 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell className="table-cell-optional">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="table-cell-optional">
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="table-cell-optional">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="table-cell-optional">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))
          ) : users.isError ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <ErrorState error={users.error} fallback="Failed to load users." compact />
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <EmptyState icon={Users} message="No users found." compact />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(MOBILE_HIDDEN_COLUMNS.has(cell.column.id) && 'table-cell-optional')}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {users.isSuccess && users.data.totalCount > 0 && (
        <UsersPagination pagination={users.data} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <EditUserDialog user={editingUser} onOpenChange={(open) => !open && setEditingUser(null)} />

      <DeactivateUsersDialog
        selectedUsers={selectedUsers}
        open={confirmingDeactivate}
        onOpenChange={setConfirmingDeactivate}
        onDeactivated={handleStatusChanged}
      />
    </div>
  )
}
