import { Skeleton } from '@/components/ui/skeleton'

type ListRowSkeletonProps = {
  rows?: number
  showMeta?: boolean
  metaWidth?: string
}

export default function ListRowSkeleton({ rows = 3, showMeta = true, metaWidth = 'w-28' }: ListRowSkeletonProps) {
  return (
    <div className="list-stack">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="list-row">
          <div className="list-dateline">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="dateline-badge h-5 w-16 rounded-full" />
          </div>

          <div className="card-header-row">
            <Skeleton className="h-6 w-2/3 max-w-sm rounded-md sm:h-7" />
            <div className="card-actions">
              <Skeleton className="skeleton-action" />
              <Skeleton className="skeleton-action" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:max-w-2xl">
            <Skeleton className="h-3.5 w-full rounded-full" />
            <Skeleton className="h-3.5 w-4/5 rounded-full" />
          </div>

          {showMeta && <Skeleton className={`h-3 rounded-full ${metaWidth}`} />}
        </div>
      ))}
    </div>
  )
}
