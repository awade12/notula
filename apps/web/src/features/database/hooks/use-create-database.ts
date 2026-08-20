import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Database } from '../types'

export function useCreateDatabase(spaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      title?: string
      parentId?: string | null
      icon?: string | null
    }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases`, {
        method: 'POST',
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to create database')
      }

      return response.json() as Promise<{ database: Database }>
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['databases', spaceId] })
      void queryClient.invalidateQueries({
        queryKey: ['databases', spaceId, variables.parentId ?? null],
      })
    },
  })
}
