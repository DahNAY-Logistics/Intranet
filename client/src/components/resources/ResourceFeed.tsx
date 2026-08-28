import { BookOpen } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import type { ResourceResponse } from 'core/types/resources'

import ResourceFeedCard from './ResourceFeedCard'

type ResourceFeedProps = {
  resources: ResourceResponse[]
  isLoading?: boolean
  emptyMessage?: string
}

export default function ResourceFeed({ resources, isLoading = false, emptyMessage = 'No resources yet.' }: ResourceFeedProps) {
  if (isLoading) {
    return (
      <div className="library-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="library-card">
            <span className="sk-block size-9 rounded-sm" />
            <span className="sk-line h-5 w-3/4" />
            <div className="sk-stack flex-1">
              <span className="sk-line w-full" />
              <span className="sk-line w-2/3" />
            </div>
            <div className="library-foot">
              <span className="sk-line w-24" />
              <span className="sk-line w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (resources.length === 0) {
    return <EmptyState icon={BookOpen} message={emptyMessage} tone="home" />
  }

  return (
    <div className="library-grid">
      {resources.map((resource) => (
        <ResourceFeedCard key={resource.id} resource={resource} />
      ))}
    </div>
  )
}
