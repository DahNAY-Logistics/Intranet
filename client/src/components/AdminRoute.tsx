import { Navigate, Outlet } from 'react-router'

import { useSession } from '@/lib/auth-client'
import { roles } from 'core/constants'

export default function AdminRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return null
  }

  if (session?.user.role !== roles.admin) return <Navigate to="/home" replace />

  return <Outlet />
}
