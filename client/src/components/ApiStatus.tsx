import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { apiStatusLabels } from 'core/constants'
import { commonMessages } from 'core/messages'

export default function ApiStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<{status: string}>('/health', { signal })
      return data
    },
  })

  const status = health.isSuccess
    ? {
        label: apiStatusLabels.ok,
        detail: 'Server is up and running',
        tone: 'border-emerald-600/20 bg-emerald-600/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400',
        dot: 'bg-emerald-600 dark:bg-emerald-400',
        live: true,
      }
    : health.isError
      ? {
          label: apiStatusLabels.down,
          detail: commonMessages.API_DISCONNECTED(health.error.message),
          tone: 'border-destructive/20 bg-destructive/10 text-destructive',
          dot: 'bg-destructive',
          live: false,
        }
      : {
          label: 'Connecting…',
          detail: 'Connecting to the server…',
          tone: 'border-border bg-muted text-muted-foreground',
          dot: 'bg-muted-foreground',
          live: false,
        }

  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex',
        status.tone,
      )}
      title={status.detail}
      aria-live="polite"
    >
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        {status.live && (
          <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-75', status.dot)} />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', status.dot)} />
      </span>
      {status.label}
    </span>
  )
}
