import SharedCategoriesDialog from '@/components/shared/CategoriesDialog'
import { useBannersStore } from '@/stores/banners-store'

export default function CategoriesDialog() {
  const open = useBannersStore((state) => state.categoriesOpen)
  const setOpen = useBannersStore((state) => state.setCategoriesOpen)

  return (
    <SharedCategoriesDialog
      open={open}
      onOpenChange={setOpen}
      basePath="/banners/categories"
      queryKey={['categories']}
      title="Categories"
      entityLabel="Category"
      description="Add, rename, or remove banner categories."
    />
  )
}
