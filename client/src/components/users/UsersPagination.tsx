import { cn, getPageNumbers } from '@/lib/utils'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UsersResponse } from 'core/types/users'

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

type UsersPaginationProps = {
  pagination: Pick<UsersResponse, 'page' | 'pageSize' | 'totalPages'>
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export default function UsersPagination({ pagination, onPageChange, onPageSizeChange }: UsersPaginationProps) {
  const { page, pageSize, totalPages } = pagination
  const canPrevious = page > 1
  const canNext = page < totalPages

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 sm:flex-row',
        onPageSizeChange ? 'sm:justify-between' : 'sm:justify-center',
      )}
    >
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top" className="min-w-14">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Pagination className="mx-0 w-fit">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!canPrevious}
              className={!canPrevious ? 'pointer-events-none opacity-50' : undefined}
              onClick={(e) => {
                e.preventDefault()
                onPageChange(page - 1)
              }}
            />
          </PaginationItem>

          {getPageNumbers(page, totalPages).map((pageNumber, i) =>
            pageNumber === '...' ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === page}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(pageNumber)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={!canNext}
              className={!canNext ? 'pointer-events-none opacity-50' : undefined}
              onClick={(e) => {
                e.preventDefault()
                onPageChange(page + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
