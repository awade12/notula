import type { AiWorkspaceCitation } from './teamspace-ask-page'

function citationHref(citation: AiWorkspaceCitation) {
  return citation.type === 'note'
    ? `note:${citation.id}`
    : `task:${citation.boardId}/${citation.id}`
}

function citationKey(citation: AiWorkspaceCitation) {
  return `${citation.type}:${citation.id}`
}

export function resolveReferencedCitations(
  content: string,
  citations: AiWorkspaceCitation[],
  max = 8,
): AiWorkspaceCitation[] {
  if (!content.trim() || citations.length === 0) return []

  const byKey = new Map<string, AiWorkspaceCitation>()

  for (const citation of citations) {
    const href = citationHref(citation)
    if (content.includes(`](${href})`)) {
      byKey.set(citationKey(citation), citation)
    }
  }

  if (byKey.size === 0) {
    const normalizedContent = content.toLowerCase()
    for (const citation of citations) {
      if (normalizedContent.includes(citation.title.toLowerCase())) {
        byKey.set(citationKey(citation), citation)
      }
    }
  }

  return [...byKey.values()].slice(0, max)
}

export function stripTrailingCitationDump(
  content: string,
  citations: AiWorkspaceCitation[],
): string {
  if (!content.trim() || citations.length === 0) return content

  const titleLines = new Set<string>()
  for (const citation of citations) {
    titleLines.add(citation.title.trim().toLowerCase())
    if (citation.type === 'task') {
      titleLines.add(`${citation.title} · ${citation.boardTitle}`.trim().toLowerCase())
    }
  }

  const lines = content.replace(/\r\n/g, '\n').split('\n')

  while (lines.length > 0) {
    const last = lines[lines.length - 1]?.trim()
    if (!last) {
      lines.pop()
      continue
    }

    if (titleLines.has(last.toLowerCase())) {
      lines.pop()
      continue
    }

    break
  }

  return lines.join('\n').trimEnd()
}
