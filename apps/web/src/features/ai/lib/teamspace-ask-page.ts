export type AiWorkspaceCitation =
  | { type: 'note'; id: string; title: string }
  | { type: 'task'; id: string; boardId: string; title: string; boardTitle: string }

export function stripCitationLinksForPage(markdown: string) {
  return markdown.replace(/\[(.+?)\]\((?:note|task):[^)]+\)/g, '$1')
}

export function derivePageTitleFromAnswer(markdown: string) {
  const stripped = stripCitationLinksForPage(markdown).trim()
  const firstLine = stripped
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) return 'Answer from Ask'

  const heading = firstLine.match(/^#{1,3}\s+(.*)$/)
  if (heading?.[1]?.trim()) {
    return heading[1].trim().slice(0, 200)
  }

  return firstLine.replace(/\*\*(.+?)\*\*/g, '$1').slice(0, 200) || 'Answer from Ask'
}
