import { useState } from 'react'
import {
  useAiModels,
  useAiSettings,
  useRemoveAiApiKey,
  useTestAiConnection,
  useUpdateAiSettings,
} from '../hooks/use-ai-settings'
import {
  formatEmbeddingPricing,
  formatModelOptionLabel,
  formatModelPricing,
  estimateEmbeddingCostPerPage,
} from '../lib/format-model-pricing'
import {
  SettingsRow,
  SettingsSelect,
  SettingsToggle,
  settingsFieldClass,
} from './settings-controls'
import { AiFeatureFlagsSettings } from './ai-feature-flags-settings'
import { SettingsSection } from './settings-section'
import { mergeAiFeatureFlags } from '@/features/ai/lib/feature-flags'
import { cn } from '@/lib/cn'

export function AiSettingsForm() {
  const { data: settings, isLoading } = useAiSettings()
  const { data: modelData } = useAiModels()
  const models = modelData?.models ?? []
  const embedding = modelData?.embedding
  const updateSettings = useUpdateAiSettings()
  const testConnection = useTestAiConnection()
  const removeKey = useRemoveAiApiKey()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedModel = models.find((model) => model.id === settings?.defaultModel)

  if (isLoading || !settings) {
    return <p className="text-sm text-text-primary">Loading AI settings…</p>
  }

  async function saveApiKey() {
    setError(null)
    setMessage(null)
    if (!apiKeyInput.trim()) {
      setError('Enter an API key to save')
      return
    }

    try {
      await updateSettings.mutateAsync({ apiKey: apiKeyInput.trim() })
      setApiKeyInput('')
      setMessage('API key saved securely')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save API key')
    }
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="OpenRouter"
        description="Bring your own key. It is encrypted at rest on the server and never sent back to the browser."
      >
        <div className="space-y-5">
          <SettingsRow
            label="API key"
            description={
              settings.hasApiKey
                ? `Saved key: ${settings.apiKeyHint ?? 'configured'}`
                : 'Get a key at openrouter.ai — stored encrypted with AES-256-GCM.'
            }
          >
            <div className="space-y-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(event) => setApiKeyInput(event.target.value)}
                placeholder={settings.hasApiKey ? 'Paste a new key to replace' : 'sk-or-…'}
                className={settingsFieldClass}
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void saveApiKey()}
                  disabled={updateSettings.isPending}
                  className={cn(
                    'rounded-lg bg-white/10 px-3 py-2 text-xs tracking-dashboard text-text-emphasis',
                    'hover:bg-white/14 disabled:opacity-40',
                  )}
                >
                  {updateSettings.isPending ? 'Saving…' : 'Save key'}
                </button>
                {settings.hasApiKey ? (
                  <button
                    type="button"
                    onClick={() => void removeKey.mutateAsync()}
                    disabled={removeKey.isPending}
                    className={cn(
                      'rounded-lg border border-border px-3 py-2 text-xs tracking-dashboard text-text-primary',
                      'hover:bg-white/5 disabled:opacity-40',
                    )}
                  >
                    Remove key
                  </button>
                ) : null}
              </div>
            </div>
          </SettingsRow>

          <SettingsRow label="Default model" description="Used for AI completions across Notula.">
            <div className="space-y-1.5">
              <SettingsSelect
                value={settings.defaultModel}
                onChange={(value) => void updateSettings.mutateAsync({ defaultModel: value })}
                options={models.map((model) => ({
                  value: model.id,
                  label: formatModelOptionLabel(model),
                }))}
              />
              {selectedModel ? (
                <p className="text-[11px] leading-relaxed text-text-primary/65">
                  {formatModelPricing(selectedModel.pricing)} via OpenRouter
                </p>
              ) : null}
            </div>
          </SettingsRow>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setError(null)
                setMessage(null)
                try {
                  await testConnection.mutateAsync()
                  setMessage('OpenRouter connection successful')
                } catch (testError) {
                  setError(testError instanceof Error ? testError.message : 'Test failed')
                }
              }}
              disabled={!settings.hasApiKey || testConnection.isPending}
              className={cn(
                'rounded-lg border border-border px-3 py-2 text-xs tracking-dashboard text-text-primary',
                'hover:bg-white/5 disabled:opacity-40',
              )}
            >
              {testConnection.isPending ? 'Testing…' : 'Test connection'}
            </button>
          </div>

          {error ? <p className="text-meta text-red-400">{error}</p> : null}
          {message ? <p className="text-meta text-emerald-400/90">{message}</p> : null}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Embeddings & semantic search"
        description="When enabled, page content is embedded after save so hybrid and semantic search can find related notes."
      >
        <div className="space-y-3">
          <SettingsToggle
            checked={settings.enableEmbeddings}
            onChange={(value) => void updateSettings.mutateAsync({ enableEmbeddings: value })}
            label="Index page embeddings"
            description="Requires a saved OpenRouter key. Embeddings run async after each page save — never blocks typing."
          />
          <p className="text-[11px] leading-relaxed text-text-primary/65">
            Embeddings use OpenRouter&apos;s{' '}
            <span className="text-text-emphasis">{embedding?.label ?? 'text-embedding-3-small'}</span>
            {embedding ? (
              <>
                {' '}
                — {formatEmbeddingPricing(embedding)}. Typical page (~4k chars) costs about{' '}
                {estimateEmbeddingCostPerPage()} per save.
              </>
            ) : null}{' '}
            Toggle hybrid/semantic mode in Search settings. Keyword search always works without a key.
          </p>
        </div>
      </SettingsSection>

      <AiFeatureFlagsSettings flags={mergeAiFeatureFlags(settings.featureFlags)} />
    </div>
  )
}
