import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { PageAiInsights } from '../types'
import { mergeAiFeatureFlags } from '../lib/feature-flags'
import { useAiSettings } from '@/features/settings/hooks/use-ai-settings'

export function usePageAiInsights(spaceId: string, pageId: string) {
  const { data: settings } = useAiSettings()
  const flags = mergeAiFeatureFlags(settings?.featureFlags)

  const enabled =
    Boolean(settings?.hasApiKey) &&
    (flags.stalePageDetector || flags.meetingPrep || flags.duplicateDetection)

  return useQuery({
    queryKey: ['pages', spaceId, pageId, 'ai-insights'],
    queryFn: async () => {
      const response = await apiFetch(
        `/api/spaces/${spaceId}/pages/${pageId}/ai-insights`,
      )
      if (!response.ok) throw new Error('Failed to load page insights')
      return (await response.json()) as PageAiInsights
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}
