import { useState } from 'react'
import { useNavigate } from 'react-router'

import { signOut } from '@/lib/auth-client'

export function useSignOut() {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)

    await signOut({
      fetchOptions: {
        onSuccess: () => {
          void navigate('/', { replace: true })
        },
      },
    })

    setSigningOut(false)
  }

  return { signingOut, handleSignOut }
}
