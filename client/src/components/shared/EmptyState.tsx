import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
  message: string
  icon?: LucideIcon
  tone?: 'admin' | 'home'
  compact?: boolean
  children?: ReactNode
}

export default function EmptyState({ message, icon: Icon = Inbox, tone = 'admin', compact = false, children }: EmptyStateProps) {
  const isHome = tone === 'home'

  return (
    <div
      className={cn(
        isHome ? 'home-empty-state' : 'empty-state',
        compact && (isHome ? 'home-empty-state-compact' : 'empty-state-compact'),
      )}
    >
      <span className={isHome ? 'home-empty-state-icon' : 'empty-state-icon'}>
        <Icon className={compact ? 'size-4' : 'size-5'} />
      </span>

      <p className={isHome ? 'home-empty-state-text' : 'empty-state-text'}>{message}</p>

      {children}
    </div>
  )
}
