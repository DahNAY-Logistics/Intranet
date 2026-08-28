import { useSettings } from '@/hooks/use-settings'

export default function Footer() {
  const { data: settings } = useSettings()

  return (
    <footer className="footer-shell">
      <div className="footer-content">
        <p className="footer-copy">
          © {new Date().getFullYear()} {settings?.organizationName}
        </p>

        <div className="footer-links">
          {settings?.supportEmail && (
            <a href={`mailto:${settings.supportEmail}`} className="footer-link">
              Support
            </a>
          )}
          {settings?.codeOfConductUrl && (
            <a
              href={settings.codeOfConductUrl}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              Code of Conduct
            </a>
          )}
          {settings?.privacyPolicyUrl && (
            <a
              href={settings.privacyPolicyUrl}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              Privacy Policy
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
