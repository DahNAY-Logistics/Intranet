import { Plus } from 'lucide-react'

import CreateEntityDialog from '@/components/shared/CreateEntityDialog'

import BannerForm from './BannerForm'

export default function CreateDialog() {
  return (
    <CreateEntityDialog triggerLabel="Create Banner" triggerIcon={<Plus />} title="Create Banner">
      {({ open, onSuccess }) => <BannerForm key={String(open)} onSuccess={onSuccess} />}
    </CreateEntityDialog>
  )
}
