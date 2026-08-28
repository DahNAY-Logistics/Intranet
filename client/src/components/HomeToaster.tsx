import type { CSSProperties } from 'react'

import { Toaster } from '@/components/ui/sonner'

export default function HomeToaster() {
  return (
    <Toaster
      style={
        {
          '--normal-bg': 'var(--home-surface)',
          '--normal-text': 'var(--home-ink)',
          '--normal-border': 'var(--home-border)',
          '--border-radius': 'var(--radius-xl)',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'home-toast',
          title: 'home-toast-title',
          description: 'home-toast-description',
          icon: 'home-toast-icon',
          success: 'home-toast-success',
          error: 'home-toast-error',
        },
      }}
    />
  )
}
