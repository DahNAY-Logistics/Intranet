import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useResourcesStore } from '@/stores/resources-store'

export default function CategoriesDialog() {
  const open = useResourcesStore((state) => state.categoriesOpen)
  const setOpen = useResourcesStore((state) => state.setCategoriesOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/resources/categories"
      queryKey={['resource-categories']}
      title="Categories"
      entityLabel="Category"
      description="Add, rename, or remove resource categories."
    />
  )
}
