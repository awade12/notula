const ATTACHED_PUNCTUATION = /^[,.;:!?'")\]}]/
const WORD_START = /^[\p{L}\p{N}]/u

export function getGhostCompletionGap(prefix: string, suggestion: string): string {
  const trimmed = suggestion.trim()
  if (!trimmed) return ''

  const lastChar = prefix.slice(-1)
  if (!lastChar || /\s/.test(lastChar)) return ''
  if (ATTACHED_PUNCTUATION.test(trimmed)) return ''
  if (/[.!?:;,]$/.test(prefix) && WORD_START.test(trimmed)) return ' '
  if (/\S/.test(lastChar) && WORD_START.test(trimmed)) return ' '

  return ''
}

export function formatGhostCompletionText(prefix: string, suggestion: string): string {
  const trimmed = suggestion.trim()
  if (!trimmed) return ''
  return `${getGhostCompletionGap(prefix, trimmed)}${trimmed}`
}
