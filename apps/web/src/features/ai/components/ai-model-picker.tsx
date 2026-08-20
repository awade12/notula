import { Link } from '@tanstack/react-router'
import { useAiModels, useAiSettings } from '@/features/settings/hooks/use-ai-settings'
import { formatModelOptionLabel, formatModelPricing } from '@/features/settings/lib/format-model-pricing'
import { cn } from '@/lib/cn'

type AiModelPickerProps = {
  value: string | null
  onChange: (modelId: string) => void
  disabled?: boolean
}

export function AiModelPicker({ value, onChange, disabled }: AiModelPickerProps) {
  const { data: settings } = useAiSettings()
  const { data: modelData } = useAiModels()
  const models = modelData?.models ?? []
  const selected = value ?? settings?.defaultModel ?? models[0]?.id ?? ''
  const selectedModel = models.find((model) => model.id === selected)

  return (
    <div className="space-y-1.5">
      <select
        value={selected}
        disabled={disabled || models.length === 0}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full rounded-lg border border-border bg-sidebar px-2.5 py-2',
          'text-xs tracking-dashboard text-text-emphasis outline-none',
          'focus:border-white/20 disabled:opacity-40',
        )}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {formatModelOptionLabel(model)}
          </option>
        ))}
      </select>
      {selectedModel ? (
        <p className="text-[10px] leading-relaxed text-text-primary/45">
          {formatModelPricing(selectedModel.pricing)}
        </p>
      ) : null}
    </div>
  )
}

export function AiMissingKeyNotice() {
  return (
    <div className="rounded-xl border border-border bg-white/[0.03] p-4 text-sm tracking-dashboard text-text-primary">
      <p className="text-text-emphasis">OpenRouter key required</p>
      <p className="mt-2 text-[11px] leading-relaxed text-text-primary/70">
        Add your API key in settings to use AI on this page. Keys are encrypted on the server.
      </p>
      <Link
        to="/settings/ai"
        className="mt-3 inline-flex text-xs text-text-emphasis underline-offset-2 hover:underline"
      >
        Open AI settings
      </Link>
    </div>
  )
}
