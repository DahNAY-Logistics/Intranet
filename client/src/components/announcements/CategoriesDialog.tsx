import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useAnnouncementsStore } from '@/stores/announcements-store'

export default function CategoriesDialog() {
  const open = useAnnouncementsStore((state) => state.categoriesOpen)
  const setOpen = useAnnouncementsStore((state) => state.setCategoriesOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/announcements/categories"
      queryKey={['announcement-categories']}
      title="Categories"
      entityLabel="Category"
      description="Add, rename, or remove announcement categories."
    />
  )
}
