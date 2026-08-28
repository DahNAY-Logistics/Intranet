import { TriangleAlert } from 'lucide-react'

import { getErrorMessage } from '@/lib/get-error-message'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  error?: unknown
  fallback: string
  tone?: 'admin' | 'home'
  compact?: boolean
}

export default function ErrorState({ error, fallback, tone = 'admin', compact = false }: ErrorStateProps) {
  const isHome = tone === 'home'

  return (
    <div
      className={cn(
        isHome ? 'home-empty-state' : 'empty-state',
        compact && (isHome ? 'home-empty-state-compact' : 'empty-state-compact'),
      )}
      role="alert"
    >
      <span
        className={cn(
          isHome ? 'home-empty-state-icon' : 'empty-state-icon',
          isHome ? 'home-empty-state-icon-error' : 'empty-state-icon-error',
        )}
      >
        <TriangleAlert className={compact ? 'size-4' : 'size-5'} />
      </span>

      <p
        className={cn(
          isHome ? 'home-empty-state-text' : 'empty-state-text',
          isHome ? 'home-empty-state-text-error' : 'empty-state-text-error',
        )}
      >
        {getErrorMessage(error, fallback)}
      </p>
    </div>
  )
}
