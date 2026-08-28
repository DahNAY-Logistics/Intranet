import * as Sentry from '@sentry/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@/index.css'
import App from '@/App.tsx'
import ErrorFallback from '@/components/ErrorFallback'
import { queryClient } from '@/lib/query-client'
import { initSentry } from '@/lib/sentry'

initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Sentry.ErrorBoundary
            fallback={({ eventId, resetError }) => (
              <ErrorFallback eventId={eventId} resetError={resetError} />
            )}
          >
            <App />
          </Sentry.ErrorBoundary>
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
)
