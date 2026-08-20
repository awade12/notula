import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Space } from '../types'

export function useSpaces() {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const response = await apiFetch('/api/spaces')
      if (!response.ok) {
        throw new Error('Failed to load spaces')
      }
      const data = (await response.json()) as { spaces: Space[] }
      return data.spaces
    },
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await apiFetch('/api/spaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        throw new Error('Failed to create space')
      }
      return (await response.json()) as { id: string; name: string; slug: string }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}
