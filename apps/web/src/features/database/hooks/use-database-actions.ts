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

  return { rename, updateIcon }
}
