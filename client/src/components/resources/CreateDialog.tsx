import { Plus } from 'lucide-react'

import CreateEntityDialog from '@/components/shared/CreateEntityDialog'

import ResourceForm from './ResourceForm'

export default function CreateDialog() {
  return (
    <CreateEntityDialog triggerLabel="Create Resource" triggerIcon={<Plus />} title="Create Resource">
      {({ open, onSuccess }) => <ResourceForm key={String(open)} onSuccess={onSuccess} />}
    </CreateEntityDialog>
  )
}
