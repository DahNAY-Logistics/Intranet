import { Users } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import type { DirectoryEntry } from 'core/types/directory'

import DirectoryCard from './DirectoryCard'

type DirectoryFeedProps = {
  entries: DirectoryEntry[]
  isLoading?: boolean
  emptyMessage?: string
}

export default function DirectoryFeed({ entries, isLoading = false, emptyMessage = 'No matching staff found.' }: DirectoryFeedProps) {
  if (isLoading) {
    return (
      <div className="roster-list">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="roster-row">
            <div className="roster-row-identity">
              <span className="roster-row-ring">
                <span className="sk-circle size-11" />
              </span>
              <div className="roster-row-names sk-stack">
                <span className="sk-line h-4 w-32" />
                <span className="sk-line w-24" />
              </div>
            </div>

            <div className="roster-row-placement sk-stack">
              <span className="sk-line w-24" />
              <span className="sk-line w-20" />
            </div>

            <div className="roster-row-contact sk-stack">
              <span className="sk-line w-40" />
              <span className="sk-line w-28" />
            </div>

            <span className="sk-line w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return <EmptyState icon={Users} message={emptyMessage} tone="home" />
  }

  return (
    <div className="roster-list">
      {entries.map((entry) => (
        <DirectoryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
