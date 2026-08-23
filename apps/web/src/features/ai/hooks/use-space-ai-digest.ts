import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api'

export type SpaceAiDigestHighlight = {
  id: string
  label: string
  count: number
}

export type SpaceAiDigest = {
  generatedAt: string
  highlights: SpaceAiDigestHighlight[]
  summary: string
}

export function useSpaceAiDigest(spaceId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['space-ai-digest', spaceId],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}/api/ai/space-digest/${spaceId}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Could not load digest')
      }
      return response.json() as Promise<SpaceAiDigest>
    },
    enabled: Boolean(spaceId && enabled),
    staleTime: 5 * 60_000,
  })
}
