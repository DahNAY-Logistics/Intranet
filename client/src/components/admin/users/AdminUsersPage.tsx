import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateUserDialog, DepartmentsDialog, DesignationsDialog, LocationsDialog, UsersTable } from '@/components/users'
import { useUsersAdminStore } from '@/stores/users-admin-store'
import { useUsersTableStore } from '@/stores/users-table-store'
import { userStatuses } from 'core/constants'

export default function AdminUsersPage() {
  const statusFilter = useUsersTableStore((state) => state.statusFilter)
  const setStatusFilter = useUsersTableStore((state) => state.setStatusFilter)
  const setDepartmentsOpen = useUsersAdminStore((state) => state.setDepartmentsOpen)
  const setDesignationsOpen = useUsersAdminStore((state) => state.setDesignationsOpen)
  const setLocationsOpen = useUsersAdminStore((state) => state.setLocationsOpen)

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <h1 className="page-heading">Users</h1>
        <div className="header-actions">
          <Button type="button" variant="outline" onClick={() => setDepartmentsOpen(true)}>
            Departments
          </Button>
          <Button type="button" variant="outline" onClick={() => setDesignationsOpen(true)}>
            Designations
          </Button>
          <Button type="button" variant="outline" onClick={() => setLocationsOpen(true)}>
            Locations
          </Button>
          <CreateUserDialog />
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
        <TabsList>
          <TabsTrigger value={userStatuses.active}>Active</TabsTrigger>
          <TabsTrigger value={userStatuses.inactive}>Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      <UsersTable />

      <DepartmentsDialog />
      <DesignationsDialog />
      <LocationsDialog />
    </div>
  )
}
