import { clsx, type ClassValue } from "clsx"
import { differenceInCalendarDays, format } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  const maxVisiblePages = 5
  const rangeWithDots: (number | '...')[] = []

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
    return rangeWithDots
  }

  rangeWithDots.push(1)

  if (currentPage <= 3) {
    for (let i = 2; i <= 4; i++) {
      rangeWithDots.push(i)
    }
    rangeWithDots.push('...', totalPages)
  } else if (currentPage >= totalPages - 2) {
    rangeWithDots.push('...')
    for (let i = totalPages - 3; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
  } else {
    rangeWithDots.push('...')
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      rangeWithDots.push(i)
    }
    rangeWithDots.push('...', totalPages)
  }

  return rangeWithDots
}

export function relativeDayLabel(date: Date) {
  const days = differenceInCalendarDays(date, new Date())

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1) return `In ${days} days`

  return format(date, 'MMM d')
}

export function hasEnded(endDate: Date) {
  return endDate.getTime() < Date.now()
}
