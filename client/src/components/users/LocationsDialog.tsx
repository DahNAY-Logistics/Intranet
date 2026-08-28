import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useUsersAdminStore } from '@/stores/users-admin-store'

export default function LocationsDialog() {
  const open = useUsersAdminStore((state) => state.locationsOpen)
  const setOpen = useUsersAdminStore((state) => state.setLocationsOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/users/locations"
      queryKey={['locations']}
      title="Locations"
      entityLabel="Location"
      description="Add, rename, or remove locations."
    />
  )
}
