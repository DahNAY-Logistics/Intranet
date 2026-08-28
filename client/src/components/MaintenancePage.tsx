import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import ManifestSeal from '@/components/ManifestSeal'

type MaintenancePageProps = {
  supportEmail: string
}

export default function MaintenancePage({ supportEmail }: MaintenancePageProps) {
  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <ManifestSeal className="auth-seal" />
        <CardHeader className="text-center">
          <h1 className="auth-title">Under Maintenance</h1>
          <CardDescription>We're making some improvements. Please check back shortly.</CardDescription>
        </CardHeader>
        {supportEmail && (
          <CardContent className="text-center">
            <p className="muted-text">
              Need help now?{' '}
              <a href={`mailto:${supportEmail}`} className="underline">
                {supportEmail}
              </a>
            </p>
          </CardContent>
        )}
      </Card>
    </main>
  )
}
