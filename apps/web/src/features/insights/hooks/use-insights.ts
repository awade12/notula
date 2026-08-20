import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Insight, InsightOptions } from '../types'

export function useInsightOptions(spaceId?: string) {
  return useQuery({
    queryKey: ['insights', 'options', spaceId],
    enabled: Boolean(spaceId),
    staleTime: 30_000,
    queryFn: async () => {
      const response = await apiFetch(`/api/insights/spaces/${spaceId}/options`)
      if (!response.ok) throw new Error('Failed to load insight options')
      return response.json() as Promise<InsightOptions>
    },
  })
}

export function useUpdateInsight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      spaceId,
      insightId,
      changes,
    }: {
      spaceId: string
      insightId: string
      changes: { status?: string; dueDate?: string }
    }) => {
      const response = await apiFetch(
        `/api/insights/spaces/${spaceId}/items/${insightId}`,
        { method: 'PATCH', body: JSON.stringify(changes) },
      )
      if (!response.ok) throw new Error('Failed to update insight')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['insights'] })
    },
  })
}

export function useTodayInsights() {
  return useQuery({
    queryKey: ['insights', 'today'],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await apiFetch('/api/insights/today')
      if (!response.ok) throw new Error('Failed to load today')
      return response.json() as Promise<{
        recentDecisions: Insight[]
      }>
    },
  })
}
