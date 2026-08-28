import { Plus } from 'lucide-react'

import CreateEntityDialog from '@/components/shared/CreateEntityDialog'

import QuickLinkForm from './QuickLinkForm'

export default function CreateDialog() {
  return (
    <CreateEntityDialog triggerLabel="Create Quick Link" triggerIcon={<Plus />} title="Create Quick Link">
      {({ open, onSuccess }) => <QuickLinkForm key={String(open)} onSuccess={onSuccess} />}
    </CreateEntityDialog>
  )
}
