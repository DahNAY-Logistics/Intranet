import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useQuickLinksStore } from '@/stores/quick-links-store'

export default function CategoriesDialog() {
  const open = useQuickLinksStore((state) => state.categoriesOpen)
  const setOpen = useQuickLinksStore((state) => state.setCategoriesOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/quick-links/categories"
      queryKey={['quick-link-categories']}
      title="Categories"
      entityLabel="Category"
      description="Add, rename, or remove quick link categories."
    />
  )
}
