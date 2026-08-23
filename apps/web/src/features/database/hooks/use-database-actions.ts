import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export function useDatabaseActions(spaceId: string, databaseId: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['database', spaceId, databaseId] })
    void queryClient.invalidateQueries({ queryKey: ['databases', spaceId] })
  }

  const rename = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases/${databaseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
      if (!response.ok) throw new Error('Failed to rename database')
      return response.json()
    },
    onSuccess: invalidate,
  })

  const updateIcon = useMutation({
    mutationFn: async (icon: string | null) => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases/${databaseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ icon }),
      })
      if (!response.ok) throw new Error('Failed to update icon')
      return response.json()
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/api/spaces/${spaceId}/databases/${databaseId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete board')
      return response.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['database', spaceId, databaseId] })
      void queryClient.invalidateQueries({ queryKey: ['databases', spaceId] })
      void queryClient.invalidateQueries({ queryKey: ['project-boards', spaceId] })
    },
  })

  return { rename, updateIcon, remove }
}
