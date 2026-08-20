import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DatabaseViewConfig } from '@notesapp/shared'
import { apiFetch } from '@/lib/api'
import type { Database } from '../types'

export function useCreateView(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      type: 'table' | 'board'
      title?: string
      groupByPropertyId?: string | null
    }) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/views`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to create view')
      }
      return response.json() as Promise<{ database: Database }>
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['database', spaceId, databaseId], data.database)
    },
  })
}

export function useUpdateView(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      viewId,
      title,
      config,
    }: {
      viewId: string
      title?: string
      config?: DatabaseViewConfig
    }) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${databaseId}/views/${viewId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ title, config }),
        },
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to update view')
      }
      return response.json() as Promise<{ database: Database }>
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['database', spaceId, databaseId], data.database)
    },
  })
}
