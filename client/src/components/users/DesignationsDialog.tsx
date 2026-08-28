import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useUsersAdminStore } from '@/stores/users-admin-store'

export default function DesignationsDialog() {
  const open = useUsersAdminStore((state) => state.designationsOpen)
  const setOpen = useUsersAdminStore((state) => state.setDesignationsOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/users/designations"
      queryKey={['designations']}
      title="Designations"
      entityLabel="Designation"
      description="Add, rename, or remove designations."
    />
  )
}
