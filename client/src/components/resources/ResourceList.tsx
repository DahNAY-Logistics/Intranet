import { BookOpen } from 'lucide-react'

import { EmptyState, ListRowSkeleton } from '@/components/shared'
import type { ResourceResponse } from 'core/types/resources'

import ResourceCard from './ResourceCard'

type ResourceListProps = {
  resources: ResourceResponse[]
  onEdit: (resource: ResourceResponse) => void
  onDelete: (resource: ResourceResponse) => void
  isLoading?: boolean
  emptyMessage?: string
}

export default function ResourceList({
  resources,
  onEdit,
  onDelete,
  isLoading = false,
  emptyMessage = 'No resources yet.',
}: ResourceListProps) {
  if (isLoading) {
    return <ListRowSkeleton showMeta={false} />
  }

  if (resources.length === 0) {
    return <EmptyState icon={BookOpen} message={emptyMessage} />
  }

  return (
    <div className="list-stack">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} onEdit={() => onEdit(resource)} onDelete={() => onDelete(resource)} />
      ))}
    </div>
  )
}
