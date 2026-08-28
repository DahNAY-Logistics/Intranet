import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { getErrorMessage } from '@/lib/get-error-message'

type ErrorAlertProps = {
  error?: unknown
  fallback: string
  className?: string
}

export default function ErrorAlert({ error, fallback, className }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle />
      <AlertDescription>{getErrorMessage(error, fallback)}</AlertDescription>
    </Alert>
  )
}
