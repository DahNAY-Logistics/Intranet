import { Navigate, Outlet } from 'react-router'

import { useSession } from '@/lib/auth-client'

export default function ProtectedRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return null
  }

  if (!session) return <Navigate to="/" replace />

  return <Outlet />
}
