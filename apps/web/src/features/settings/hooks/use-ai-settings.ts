import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { AiEmbeddingOption, AiModelOption } from '../lib/format-model-pricing'
import type { AiSettings } from '../preferences-types'

type AiModelsResponse = {
  models: AiModelOption[]
  embedding: AiEmbeddingOption
}

export function useAiSettings() {
  return useQuery({
    queryKey: ['settings', 'ai'],
    queryFn: async () => {
      const response = await apiFetch('/api/settings/ai')
      if (!response.ok) throw new Error('Failed to load AI settings')
      return (await response.json()) as AiSettings
    },
  })
}

export function useAiModels() {
  return useQuery({
    queryKey: ['settings', 'ai', 'models'],
    queryFn: async () => {
      const response = await apiFetch('/api/settings/ai/models')
      if (!response.ok) throw new Error('Failed to load models')
      const data = (await response.json()) as AiModelsResponse
      return data
    },
  })
}

import type { AiFeatureFlags } from '@/features/ai/lib/feature-flags'

export function useUpdateAiSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      defaultModel?: string
      enableEmbeddings?: boolean
      apiKey?: string | null
      featureFlags?: Partial<AiFeatureFlags>
    }) => {
      const response = await apiFetch('/api/settings/ai', {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to save AI settings')
      }
      return (await response.json()) as AiSettings
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'ai'], data)
    },
  })
}

export function useTestAiConnection() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/api/settings/ai/test', { method: 'POST' })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Connection test failed')
      }
      return true
    },
  })
}

export function useRemoveAiApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/api/settings/ai/key', { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to remove API key')
      return (await response.json()) as AiSettings
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'ai'], data)
    },
  })
}
