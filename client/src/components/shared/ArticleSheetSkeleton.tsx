import { Skeleton } from '@/components/ui/skeleton'

type ArticleSheetSkeletonProps = {
  showImage?: boolean
}

export default function ArticleSheetSkeleton({ showImage = false }: ArticleSheetSkeletonProps) {
  return (
    <div className="article-sheet">
      <Skeleton className="article-seal rounded-full" />

      <div className="list-dateline pr-14 sm:pr-24">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full sm:ml-2" />
      </div>

      <div className="flex flex-col gap-2 pr-16 sm:pr-24">
        <Skeleton className="h-8 w-full rounded-md sm:h-10" />
        <Skeleton className="h-8 w-2/5 rounded-md sm:h-10" />
      </div>

      <Skeleton className="h-3 w-40 rounded-full" />

      {showImage && <Skeleton className="aspect-[2.5/1] w-full rounded-lg" />}

      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-11/12 rounded-full" />
        <Skeleton className="h-3.5 w-3/4 rounded-full" />
      </div>
    </div>
  )
}
