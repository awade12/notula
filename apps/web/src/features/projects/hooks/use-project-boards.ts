import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export type ProjectBoardSummary = {
  id: string
  spaceId: string
  parentId: string | null
  title: string
  icon: string | null
  isProjectBoard: boolean
  updatedAt: string
}

export function useProjectBoards(spaceId: string) {
  return useQuery({
    queryKey: ['project-boards', spaceId],
    queryFn: async () => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/databases?projectBoards=true`,
      )
      if (!response.ok) {
        throw new Error('Failed to load project boards')
      }
      const data = (await response.json()) as { databases: ProjectBoardSummary[] }
      return data.databases
    },
    staleTime: 30_000,
  })
}

export function useCreateProjectBoard(spaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { title?: string; icon?: string | null }) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases`, {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          icon: input.icon ?? null,
          isProjectBoard: true,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to create board')
      }

      return (await response.json()) as { database: { id: string } }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project-boards', spaceId] })
    },
  })
}
