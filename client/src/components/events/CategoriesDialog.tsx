import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useEventsStore } from '@/stores/events-store'

export default function CategoriesDialog() {
  const open = useEventsStore((state) => state.categoriesOpen)
  const setOpen = useEventsStore((state) => state.setCategoriesOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/events/categories"
      queryKey={['event-categories']}
      title="Categories"
      entityLabel="Category"
      description="Add, rename, or remove event categories."
    />
  )
}
