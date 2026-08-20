import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Database } from '../types'

export function useDatabase(spaceId: string, databaseId: string) {
  return useQuery({
    queryKey: ['database', spaceId, databaseId],
    queryFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases/${databaseId}`)
      if (!response.ok) {
        throw new Error('Failed to load database')
      }
      const data = (await response.json()) as { database: Database }
      return data.database
    },
    staleTime: 30_000,
  })
}
