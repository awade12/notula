export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

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

export const POPULAR_OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'openai/gpt-4o', label: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct', label: 'Mistral Small 3.1' },
] as const

export const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small'

export const DEFAULT_EMBEDDING_OPTION: AiEmbeddingOption = {
  id: DEFAULT_EMBEDDING_MODEL,
  label: 'text-embedding-3-small',
  pricing: {
    inputPerMillion: 0.02,
    outputPerMillion: null,
  },
}

type OpenRouterModelRecord = {
  id: string
  name: string
  pricing?: {
    prompt?: string
    completion?: string
  }
}

let modelCatalogCache: {
  expiresAt: number
  byId: Map<string, AiModelPricing>
} | null = null

const MODEL_CATALOG_TTL_MS = 1000 * 60 * 60

function pricingFromRecord(pricing?: OpenRouterModelRecord['pricing']): AiModelPricing {
  return {
    inputPerMillion: tokenPriceToPerMillion(pricing?.prompt),
    outputPerMillion: tokenPriceToPerMillion(pricing?.completion),
  }
}

function tokenPriceToPerMillion(pricePerToken: string | undefined): number | null {
  if (!pricePerToken) return null
  const value = Number(pricePerToken)
  if (!Number.isFinite(value)) return null
  return value * 1_000_000
}

async function getOpenRouterPricingCatalog() {
  const now = Date.now()
  if (modelCatalogCache && modelCatalogCache.expiresAt > now) {
    return modelCatalogCache.byId
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/models`)
  if (!response.ok) {
    throw new Error('Could not load model pricing from OpenRouter')
  }

  const payload = (await response.json()) as { data?: OpenRouterModelRecord[] }
  const byId = new Map<string, AiModelPricing>()

  for (const model of payload.data ?? []) {
    byId.set(model.id, pricingFromRecord(model.pricing))
  }

  modelCatalogCache = {
    expiresAt: now + MODEL_CATALOG_TTL_MS,
    byId,
  }

  return byId
}

function withPricing(
  model: { id: string; label: string },
  catalog: Map<string, AiModelPricing>,
): AiModelOption {
  return {
    id: model.id,
    label: model.label,
    pricing: catalog.get(model.id) ?? { inputPerMillion: null, outputPerMillion: null },
  }
}

export async function getPopularOpenRouterModels(): Promise<AiModelOption[]> {
  try {
    const catalog = await getOpenRouterPricingCatalog()
    return POPULAR_OPENROUTER_MODELS.map((model) => withPricing(model, catalog))
  } catch {
    return POPULAR_OPENROUTER_MODELS.map((model) => ({
      id: model.id,
      label: model.label,
      pricing: { inputPerMillion: null, outputPerMillion: null },
    }))
  }
}

export async function fetchOpenRouterModels(apiKey: string): Promise<AiModelOption[]> {
  const [response, catalog] = await Promise.all([
    fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }),
    getOpenRouterPricingCatalog().catch(() => new Map<string, AiModelPricing>()),
  ])

  if (!response.ok) {
    throw new Error('Could not load models from OpenRouter')
  }

  const payload = (await response.json()) as { data?: OpenRouterModelRecord[] }
  const models = payload.data ?? []

  return models
    .map((model) => {
      const pricing = pricingFromRecord(model.pricing)
      const hasPricing = pricing.inputPerMillion != null || pricing.outputPerMillion != null

      return {
        id: model.id,
        label: model.name || model.id,
        pricing: hasPricing ? pricing : (catalog.get(model.id) ?? { inputPerMillion: null, outputPerMillion: null }),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

export async function testOpenRouterConnection(apiKey: string, model: string) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      max_tokens: 8,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'OpenRouter request failed')
  }

  return true
}

export async function createEmbedding(apiKey: string, input: string) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_EMBEDDING_MODEL,
      input,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Embedding request failed')
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>
  }

  const embedding = payload.data?.[0]?.embedding
  if (!embedding || embedding.length === 0) {
    throw new Error('Embedding response was empty')
  }

  return embedding
}

export async function createChatCompletion(
  apiKey: string,
  model: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Completion request failed')
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return payload.choices?.[0]?.message?.content ?? ''
}

export async function streamChatCompletion(
  apiKey: string,
  model: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  signal?: AbortSignal,
  maxTokens?: number,
) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Completion request failed')
  }

  if (!response.body) {
    throw new Error('Completion stream was empty')
  }

  return response.body
}
