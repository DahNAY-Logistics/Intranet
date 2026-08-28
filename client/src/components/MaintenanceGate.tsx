import { Outlet } from 'react-router'

import MaintenancePage from '@/components/MaintenancePage'
import { useSettings } from '@/hooks/use-settings'
import { useSession } from '@/lib/auth-client'
import { roles } from 'core/constants'

export default function MaintenanceGate() {
  const { data: session } = useSession()
  const isAdmin = session?.user.role === roles.admin

  const settings = useSettings({ refetchInterval: 30_000 })

  if (isAdmin) return <Outlet />

  if (settings.data?.maintenanceMode) {
    return <MaintenancePage supportEmail={settings.data.supportEmail} />
  }

  return <Outlet />
}
