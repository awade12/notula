import type { AiWorkspaceCitation } from './teamspace-ask-page'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function citationHref(citation: AiWorkspaceCitation) {
  return citation.type === 'note'
    ? `note:${citation.id}`
    : `task:${citation.boardId}/${citation.id}`
}

function isTitleLinked(content: string, title: string, href: string) {
  if (content.includes(`](${href})`)) return true
  return content.includes(`[${title}](`)
}

function linkFirstMatch(content: string, pattern: RegExp, title: string, href: string) {
  if (!pattern.test(content)) return content
  return content.replace(pattern, `[${title}](${href})`)
}

export function applyCitationLinks(content: string, citations: AiWorkspaceCitation[]) {
  if (!content.trim() || citations.length === 0) return content

  let result = content
  const sorted = [...citations].sort((a, b) => b.title.length - a.title.length)

  for (const citation of sorted) {
    const href = citationHref(citation)
    if (isTitleLinked(result, citation.title, href)) continue

    const escapedTitle = escapeRegExp(citation.title)
    const taskPrefixPattern = new RegExp(`Task:\\s*${escapedTitle}`, 'i')
    result = linkFirstMatch(result, taskPrefixPattern, citation.title, href)
    if (isTitleLinked(result, citation.title, href)) continue

    const boldPattern = new RegExp(`\\*\\*${escapedTitle}\\*\\*`, 'i')
    result = linkFirstMatch(result, boldPattern, citation.title, href)
    if (isTitleLinked(result, citation.title, href)) continue

    const plainPattern = new RegExp(`(?<!\\[)${escapedTitle}(?!\\])`, 'i')
    result = linkFirstMatch(result, plainPattern, citation.title, href)
  }

  return result
}
