import { Skeleton } from '@/components/ui/skeleton'

type SkeletonFieldRowProps = {
  height?: string
}

export default function SkeletonFieldRow({ height = 'h-9' }: SkeletonFieldRowProps) {
  return (
    <div className="form-grid-2">
      <Skeleton className={`${height} w-full`} />
      <Skeleton className={`${height} w-full`} />
    </div>
  )
}
