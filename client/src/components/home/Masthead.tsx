import { useEffect, useState } from 'react'
import { format } from 'date-fns'

import { useMe } from '@/hooks/use-me'
import { useSettings } from '@/hooks/use-settings'

export default function Masthead() {
  const { data: me } = useMe()
  const { data: settings } = useSettings()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const siteName = settings?.siteName ?? 'Intranet'

  return (
    <header className="home-dispatch">
      <div className="home-dispatch-bar">
        <span className="home-dispatch-channel">
          <span aria-hidden="true" className="home-onair-dot" />
          {siteName}//Dispatch
        </span>
        <span className="home-dispatch-date">{format(now, 'EEE dd MMM yyyy')}</span>
      </div>

      <p className="home-dispatch-prompt">
        <span aria-hidden="true" className="home-dispatch-arrow">
          &gt;
        </span>
        Hola{me ? `, ${me.name}` : ''}
        <span aria-hidden="true" className="home-dispatch-cursor" />
      </p>
    </header>
  )
}
