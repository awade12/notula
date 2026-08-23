import type { AiWorkspaceCitation } from './teamspace-ask-page'

export function parseCitationsHeader(value: string | null): AiWorkspaceCitation[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as AiWorkspaceCitation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseAiSsePart(raw: string) {
  let content = ''
  let citations: AiWorkspaceCitation[] | undefined

  for (const line of raw.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6).trim()
    if (!payload || payload === '[DONE]') continue

    try {
      const parsed = JSON.parse(payload) as {
        notesapp?: { citations?: AiWorkspaceCitation[] }
        choices?: Array<{ delta?: { content?: string } }>
      }

      if (Array.isArray(parsed.notesapp?.citations)) {
        citations = parsed.notesapp.citations
        continue
      }

      const delta = parsed.choices?.[0]?.delta?.content
      if (delta) content += delta
    } catch {
      // Ignore malformed chunks from upstream.
    }
  }

  return { content, citations }
}
