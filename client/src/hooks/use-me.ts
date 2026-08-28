import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { MeResponse } from 'core/types/users'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<MeResponse>('/me', { signal })
      return data
    },
  })
}
