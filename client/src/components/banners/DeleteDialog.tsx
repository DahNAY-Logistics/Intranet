import DeleteEntityDialog from '@/components/shared/DeleteEntityDialog'
import { bannerMessages } from 'core/messages'
import type { BannerResponse } from 'core/types/banners'

type DeleteDialogProps = {
  banner: BannerResponse | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export default function DeleteDialog({ banner, onOpenChange, onDeleted }: DeleteDialogProps) {
  return (
    <DeleteEntityDialog
      item={banner}
      onOpenChange={onOpenChange}
      onDeleted={onDeleted}
      basePath="/banners"
      invalidateKey={['banners']}
      getTitle={(item) => item.title}
      successMessage={bannerMessages.DELETED}
      fallbackError="Failed to delete banner."
      noItemLabel="this banner"
    />
  )
}
