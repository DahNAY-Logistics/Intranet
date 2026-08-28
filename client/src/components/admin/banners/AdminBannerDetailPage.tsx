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
import { DeleteDialog, EditDialog } from '@/components/banners'
import { bannerStatuses } from 'core/constants'
import type { BannerDetailResponse, BannerResponse } from 'core/types/banners'

export default function AdminBannerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState<BannerResponse | null>(null)

  const banner = useQuery({
    queryKey: ['banners', id],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<BannerDetailResponse>(`/banners/${id}`, { signal })
      return data.banner
    },
    enabled: id !== undefined,
  })

  return (
    <div className="page-stack">
      <div className="row-between">
        <Link to="/admin/banners" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}>
          <ArrowLeft />
          Back
        </Link>

        {banner.isSuccess && (
          <div className="card-actions">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
              <Pencil />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDeleting(banner.data)}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {banner.isPending && <ArticleSheetSkeleton showImage />}

      {banner.isError && <ErrorAlert error={banner.error} fallback="Failed to load banner." />}

      {banner.isSuccess && (
        <article className="article-sheet">
          <ManifestSeal className="article-seal" />

          <div className="article-dateline">
            <span>
              {format(new Date(banner.data.startDate), 'PP')} – {format(new Date(banner.data.endDate), 'PP')}
            </span>
            <span aria-hidden="true">·</span>
            <span>{banner.data.category.name}</span>
            <Badge
              variant={banner.data.status === bannerStatuses.published ? 'default' : 'secondary'}
              className="sm:ml-2"
            >
              {banner.data.status}
            </Badge>
          </div>

          <h1 className="article-title">{banner.data.title}</h1>

          <span className="meta-text">Posted by {banner.data.postedBy.name}</span>

          <img src={banner.data.attachment.url} alt="" className="aspect-2.5/1 w-full rounded-lg object-cover" />

          <p className="article-body">{banner.data.excerpt}</p>
        </article>
      )}

      <EditDialog id={editing && id !== undefined ? Number(id) : null} onOpenChange={(open) => setEditing(open)} />

      <DeleteDialog
        banner={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => navigate('/admin/banners')}
      />
    </div>
  )
}
