import { apiUrl } from '@/lib/api'
import type { AiCompletionRequest } from '../types'

function parseSseChunk(raw: string) {
  const lines = raw.split('\n')
  let content = ''

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6).trim()
    if (!payload || payload === '[DONE]') continue

    try {
      const parsed = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>
      }
      const delta = parsed.choices?.[0]?.delta?.content
      if (delta) content += delta
    } catch {
      // Ignore malformed chunks.
    }
  }

  return content
}

export async function streamAiCompletion(
  input: AiCompletionRequest,
  onChunk: (chunk: string, fullText: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${apiUrl}/api/ai/complete`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })

  if (!response.ok) {
    const data = (await response.json()) as { error?: string }
    throw new Error(data.error ?? 'Completion failed')
  }

  if (!response.body) {
    throw new Error('Empty completion stream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const chunk = parseSseChunk(part)
      if (chunk) {
        fullText += chunk
        onChunk(chunk, fullText)
      }
    }
  }

  if (buffer.trim()) {
    const chunk = parseSseChunk(buffer)
    if (chunk) {
      fullText += chunk
      onChunk(chunk, fullText)
    }
  }

  return fullText
}
