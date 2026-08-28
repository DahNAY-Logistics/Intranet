import { useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'

import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import ErrorAlert from '@/components/ErrorAlert'
import { ArticleSheetSkeleton } from '@/components/shared'
import ManifestSeal from '@/components/ManifestSeal'
import { DeleteDialog, EditDialog, MarkdownContent } from '@/components/resources'
import { resourceStatuses } from 'core/constants'
import type { ResourceDetailResponse, ResourceResponse } from 'core/types/resources'

export default function AdminResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState<ResourceResponse | null>(null)

  const resource = useQuery({
    queryKey: ['resources', Number(id)],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<ResourceDetailResponse>(`/resources/${id}`, { signal })
      return data.resource
    },
    enabled: id !== undefined,
  })

  return (
    <div className="page-stack">
      <div className="row-between">
        <Link to="/admin/resources" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
          <ArrowLeft />
          Back
        </Link>

        {resource.isSuccess && (
          <div className="card-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              data-testid="resource-detail-edit"
              onClick={() => setEditing(true)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              data-testid="resource-detail-delete"
              onClick={() => setDeleting(resource.data)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {resource.isPending && <ArticleSheetSkeleton />}

      {resource.isError && <ErrorAlert error={resource.error} fallback="Failed to load resource." />}

      {resource.isSuccess && (
        <article className="article-sheet">
          <ManifestSeal className="article-seal" />

          <div className="article-dateline">
            <span>{format(new Date(resource.data.createdAt), 'MMM d, yyyy')}</span>
            <span aria-hidden="true">·</span>
            <span>{resource.data.category.name}</span>
            <Badge
              variant={resource.data.status === resourceStatuses.published ? 'default' : 'secondary'}
              className="sm:ml-2"
            >
              {resource.data.status}
            </Badge>
          </div>

          <h1 className="article-title">{resource.data.title}</h1>

          <span className="meta-text">Posted by {resource.data.postedBy.name}</span>

          <p className="article-body">{resource.data.excerpt}</p>

          {resource.data.url && (
            <a
              href={resource.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {resource.data.url}
            </a>
          )}

          <div className="overflow-hidden rounded-md border">
            <MarkdownContent value={resource.data.content} />
          </div>
        </article>
      )}

      <EditDialog id={editing && id !== undefined ? Number(id) : null} onOpenChange={(open) => setEditing(open)} />

      <DeleteDialog
        resource={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => navigate('/admin/resources')}
      />
    </div>
  )
}
