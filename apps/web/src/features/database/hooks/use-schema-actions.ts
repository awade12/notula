import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DatabaseSchema } from '@notesapp/shared'
import { apiFetch } from '@/lib/api'
import type { Database } from '../types'

export function useUpdateDatabaseSchema(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (schema: DatabaseSchema) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/schema`,
        {
          method: 'PATCH',
          body: JSON.stringify({ schema }),
        },
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to update schema')
      }
      return response.json() as Promise<{ database: Database }>
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['database', spaceId, databaseId], data.database)
      void queryClient.invalidateQueries({
        queryKey: ['database-rows', spaceId, databaseId],
      })
    },
  })
}
