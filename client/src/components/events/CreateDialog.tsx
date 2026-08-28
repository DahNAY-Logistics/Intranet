import { Plus } from 'lucide-react'

import CreateEntityDialog from '@/components/shared/CreateEntityDialog'

import EventForm from './EventForm'

export default function CreateDialog() {
  return (
    <CreateEntityDialog triggerLabel="Create Event" triggerIcon={<Plus />} title="Create Event">
      {({ open, onSuccess }) => <EventForm key={String(open)} onSuccess={onSuccess} />}
    </CreateEntityDialog>
  )
}
