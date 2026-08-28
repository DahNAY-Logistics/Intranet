import { ArrowUpRight } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import ManifestSeal from '@/components/ManifestSeal'
import { signIn, useSession } from '@/lib/auth-client'
import { useSignInStore } from '@/stores/sign-in-store'
import { commonMessages } from 'core/messages'

export default function LandingPage() {
  const { data: session, isPending } = useSession()
  const [searchParams] = useSearchParams()
  const signInError = useSignInStore((store) => store.error)
  const failWith = useSignInStore((store) => store.failWith)

  if (session) return <Navigate to="/home" replace />

  const callbackError = searchParams.has('error') ? commonMessages.ACCESS_DENIED : null
  const message = signInError ?? callbackError

  async function handleSignIn() {
    const { error } = await signIn.oauth2({
      providerId: 'zoho',
      callbackURL: '/home',
      errorCallbackURL: '/?error=access_denied',
    })

    if (error) failWith(commonMessages.SIGNIN_UNREACHABLE)
  }

  return (
    <main className="login-shell">
      <div aria-hidden="true" className="login-grid-overlay" />

      <header className="login-header">
        <div className="login-brand">
          <ManifestSeal className="login-brand-seal" />
          <p className="login-brand-name">DahNAY</p>
        </div>

        <div className="login-access">
          <p className="login-access-label">Terminal Access</p>
          <Button
            size="lg"
            onClick={() => void handleSignIn()}
            disabled={isPending}
            className="group relative gap-2 rounded-sm border-2 border-dashed border-(--login-ink)/30 bg-(--login-ink) px-5 text-(--login-button-fg) hover:bg-(--login-ink)/90"
          >
            <span aria-hidden="true" className="login-signin-grommet" />
            Sign in
            <ArrowUpRight className="login-signin-icon" />
          </Button>

          {message && (
            <p role="alert" className="login-alert">
              {message}
            </p>
          )}
        </div>
      </header>

      <div className="login-content">
        <p className="login-eyebrow">DahNAY Internal Platform</p>
        <h1 className="login-heading">
          Every route
          <br />
          <span className="login-heading-accent">leads home.</span>
        </h1>
        <div aria-hidden="true" className="login-divider" />
        <p className="login-body">
          Your access point to DahNAY&rsquo;s internal information &mdash; announcements,
          policies and people, all in one place.
        </p>
        <p className="login-meta">
          System &mdash; Internal Platform &nbsp;&middot;&nbsp; Updated &mdash; Daily
          &nbsp;&middot;&nbsp; Destination &mdash; /home
        </p>
      </div>

      <footer className="login-footer">
        <p className="login-footer-text-compact">DahNAY Intranet &nbsp;//&nbsp; Status: Live</p>
        <p className="login-footer-text-full">
          Origin: DahNAY HQ &nbsp;//&nbsp; Access: Every Department &nbsp;//&nbsp; Contents:
          Announcements, People &amp; Resources &nbsp;//&nbsp; Status: Live
        </p>
      </footer>
    </main>
  )
}
