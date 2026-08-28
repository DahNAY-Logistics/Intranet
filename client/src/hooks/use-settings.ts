import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { SettingsResponse } from 'core/types/settings'

export function useSettings(options?: Partial<UseQueryOptions<SettingsResponse>>) {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<SettingsResponse>('/settings', { signal })
      return data
    },
    ...options,
  })
}
