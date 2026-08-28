import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useUsersAdminStore } from '@/stores/users-admin-store'

export default function DepartmentsDialog() {
  const open = useUsersAdminStore((state) => state.departmentsOpen)
  const setOpen = useUsersAdminStore((state) => state.setDepartmentsOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/users/departments"
      queryKey={['departments']}
      title="Departments"
      entityLabel="Department"
      description="Add, rename, or remove departments."
    />
  )
}
