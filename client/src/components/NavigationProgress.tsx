import { useEffect, useRef } from 'react'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

import { useSession } from '@/lib/auth-client'

export default function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null)
  const { isPending } = useSession()

  useEffect(() => {
    if (isPending) {
      ref.current?.continuousStart()
    } else {
      ref.current?.complete()
    }
  }, [isPending])

  return <LoadingBar color="var(--muted-foreground)" ref={ref} shadow height={2} />
}
