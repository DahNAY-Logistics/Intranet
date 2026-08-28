import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ErrorAlert from '@/components/ErrorAlert'

type EditEntityDialogProps<T> = {
  id: number | null
  onOpenChange: (open: boolean) => void
  queryKey: unknown[]
  queryFn: (signal: AbortSignal) => Promise<T>
  title: string
  loadingSkeleton: ReactNode
  fallbackError: string
  children: (data: T, onSuccess: () => void) => ReactNode
}

export default function EditEntityDialog<T>({
  id,
  onOpenChange,
  queryKey,
  queryFn,
  title,
  loadingSkeleton,
  fallbackError,
  children,
}: EditEntityDialogProps<T>) {
  const item = useQuery({
    queryKey,
    queryFn: ({ signal }) => queryFn(signal),
    enabled: id !== null,
  })

  return (
    <Dialog open={id !== null} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {item.isPending && loadingSkeleton}

        {item.isError && <ErrorAlert error={item.error} fallback={fallbackError} />}

        {item.isSuccess && children(item.data, () => onOpenChange(false))}
      </DialogContent>
    </Dialog>
  )
}
