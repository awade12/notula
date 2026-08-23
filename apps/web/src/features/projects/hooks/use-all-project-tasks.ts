import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export type AllProjectTask = {
  id: string
  boardId: string
  boardTitle: string
  title: string
  snippet: string
  status: string | null
  assigneeId: string | null
  dueDate: string | null
  updatedAt: string
}

export function useAllProjectTasks(spaceId: string) {
  return useQuery({
    queryKey: ['all-project-tasks', spaceId],
    queryFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/search/project-tasks`)
      if (!response.ok) throw new Error('Failed to load tasks')
      const data = (await response.json()) as { tasks: AllProjectTask[] }
      return data.tasks
    },
    enabled: Boolean(spaceId),
  })
}
