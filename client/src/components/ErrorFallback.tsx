import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import ManifestSeal from '@/components/ManifestSeal'
import { commonMessages } from 'core/messages'

type ErrorFallbackProps = {
  eventId: string
  resetError: () => void
}

export default function ErrorFallback({ eventId, resetError }: ErrorFallbackProps) {
  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <ManifestSeal className="auth-seal" />
        <CardHeader className="text-center">
          <h1 className="auth-title">Something went wrong</h1>
          <CardDescription>{commonMessages.UNEXPECTED_ERROR}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Button onClick={resetError}>Try again</Button>
          {eventId && (
            <p className="muted-text">
              Reference: <code>{eventId}</code>
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
