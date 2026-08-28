import { format } from 'date-fns'
import { FileText, Link2 } from 'lucide-react'
import { Link } from 'react-router'

import type { ResourceResponse } from 'core/types/resources'

type ResourceFeedCardProps = {
  resource: ResourceResponse
}

export default function ResourceFeedCard({ resource }: ResourceFeedCardProps) {
  return (
    <article className="library-card group">
      <span className="library-icon">
        {resource.url ? <Link2 className="size-4" /> : <FileText className="size-4" />}
      </span>

      <Link to={`/resources/${resource.id}`} className="library-title">
        {resource.title}
      </Link>

      <p className="library-excerpt">{resource.excerpt}</p>

      <div className="library-foot">
        <span className="library-cat">{resource.category.name}</span>
        <span>{format(new Date(resource.createdAt), 'dd MMM yyyy')}</span>
      </div>
    </article>
  )
}
