export type AiModelPricing = {
  inputPerMillion: number | null
  outputPerMillion: number | null
}

export type AiModelOption = {
  id: string
  label: string
  pricing: AiModelPricing
}

export type AiEmbeddingOption = {
  id: string
  label: string
  pricing: AiModelPricing
}

function formatUsdPerMillion(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(2)}`
  return `$${value.toFixed(3)}`
}

export function formatModelPricing(pricing: AiModelPricing): string {
  const input = formatUsdPerMillion(pricing.inputPerMillion)
  const output = formatUsdPerMillion(pricing.outputPerMillion)

  if (input && output) return `${input} in / ${output} out per 1M tokens`
  if (input) return `${input} per 1M tokens`
  if (output) return `${output} out per 1M tokens`
  return 'Pricing unavailable'
}

export function formatModelOptionLabel(model: AiModelOption): string {
  const cost = formatModelPricing(model.pricing)
  if (cost === 'Pricing unavailable') return model.label
  return `${model.label} — ${cost}`
}

export function formatEmbeddingPricing(embedding: AiEmbeddingOption): string {
  const input = formatUsdPerMillion(embedding.pricing.inputPerMillion)
  if (input) return `${input} per 1M tokens indexed`
  return 'Pricing unavailable'
}

export function estimateEmbeddingCostPerPage(contentLength = 4000): string {
  const tokens = Math.max(1, Math.ceil(contentLength / 4))
  const cost = (tokens / 1_000_000) * 0.02
  if (cost < 0.0001) return '< $0.0001'
  if (cost < 0.01) return `~$${cost.toFixed(4)}`
  return `~$${cost.toFixed(3)}`
}
