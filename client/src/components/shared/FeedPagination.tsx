import { ArrowLeft, ArrowRight } from 'lucide-react'

import { cn, getPageNumbers } from '@/lib/utils'

type FeedPaginationProps = {
  pagination: { page: number; totalPages: number }
  onPageChange: (page: number) => void
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export default function FeedPagination({ pagination, onPageChange }: FeedPaginationProps) {
  const { page, totalPages } = pagination
  const canPrevious = page > 1
  const canNext = page < totalPages

  return (
    <nav aria-label="Pagination" className="feed-pagination">
      <button
        type="button"
        className="feed-page-arrow"
        disabled={!canPrevious}
        onClick={() => onPageChange(page - 1)}
      >
        <ArrowLeft className="size-3.5" />
        Prev
      </button>

      <p className="feed-page-status sm:hidden">
        Page {pad(page)} of {pad(totalPages)}
      </p>

      <div className="feed-page-numbers">
        {getPageNumbers(page, totalPages).map((pageNumber, index) =>
          pageNumber === '...' ? (
            <span key={`gap-${index}`} aria-hidden="true" className="feed-page-gap">
              …
            </span>
          ) : (
            <button
              key={pageNumber}
              type="button"
              aria-label={`Go to page ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
              className={cn('feed-page-number', pageNumber === page && 'feed-page-number-active')}
              onClick={() => onPageChange(pageNumber)}
            >
              {pad(pageNumber)}
            </button>
          ),
        )}
      </div>

      <button type="button" className="feed-page-arrow" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
        Next
        <ArrowRight className="size-3.5" />
      </button>
    </nav>
  )
}
