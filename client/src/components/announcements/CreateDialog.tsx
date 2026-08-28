import { Plus } from 'lucide-react'

import CreateEntityDialog from '@/components/shared/CreateEntityDialog'

import AnnouncementForm from './AnnouncementForm'

export default function CreateDialog() {
  return (
    <CreateEntityDialog triggerLabel="Create Announcement" triggerIcon={<Plus />} title="Create Announcement">
      {({ open, onSuccess }) => <AnnouncementForm key={String(open)} onSuccess={onSuccess} />}
    </CreateEntityDialog>
  )
}
