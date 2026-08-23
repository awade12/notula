import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export type TaskActivityKind = 'comment' | 'status_change' | 'property_change' | 'created'

export type TaskActivityItem = {
  id: string
  rowId: string
  actorId: string
  actorName: string
  kind: TaskActivityKind
  body: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export function useTaskActivity(spaceId: string, boardId: string, rowId: string | undefined) {
  return useQuery({
    queryKey: ['task-activity', spaceId, boardId, rowId],
    enabled: Boolean(rowId),
    queryFn: async () => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${boardId}/rows/${rowId}/activity`,
      )
      if (!response.ok) throw new Error('Failed to load activity')
      const data = (await response.json()) as { activity: TaskActivityItem[] }
      return data.activity
    },
    staleTime: 5_000,
  })
}

export function useAddTaskComment(spaceId: string, boardId: string, rowId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string) => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases/${boardId}/rows/${rowId}/activity`,
        {
          method: 'POST',
          body: JSON.stringify({ body }),
        },
      )
      if (!response.ok) throw new Error('Failed to post comment')
      return (await response.json()) as { id: string }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['task-activity', spaceId, boardId, rowId],
      })
    },
  })
}
