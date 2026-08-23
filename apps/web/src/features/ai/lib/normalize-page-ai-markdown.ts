import { normalizeTaskAiMarkdown } from '@/features/projects/lib/normalize-task-ai-markdown'

function stripLeadingCommentary(markdown: string) {
  const lines = markdown.split('\n')
  const firstHeadingIndex = lines.findIndex((line) => /^#{1,6}\s+\S/.test(line.trim()))
  if (firstHeadingIndex <= 0) return markdown

  const before = lines.slice(0, firstHeadingIndex).join('\n').trim()
  if (!before) return markdown

  if (
    /^(here'?s|this (is|revised|updated)|i'?ve|the following|below is|sure[,!]?|certainly)/i.test(
      before,
    )
  ) {
    return lines.slice(firstHeadingIndex).join('\n').trim()
  }

  return markdown
}

function stripTrailingCommentary(markdown: string) {
  const lines = markdown.split('\n')
  let end = lines.length

  while (end > 0) {
    const line = lines[end - 1]?.trim() ?? ''
    if (!line) {
      end--
      continue
    }

    if (/^#{1,6}\s/.test(line) || /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
      break
    }

    if (
      /^(this (revised|updated|version)|these changes|hope this helps|let me know)/i.test(line) ||
      /(clarifies|ensuring alignment|as we progress)/i.test(line)
    ) {
      end--
      continue
    }

    break
  }

  return lines.slice(0, end).join('\n').trim()
}

function dedupeRepeatedDocument(markdown: string) {
  const headingMatch = markdown.match(/^#{1,2}\s+(.+)$/m)
  if (!headingMatch?.[1]) return markdown

  const title = headingMatch[1].trim()
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(^|\\n)(#{1,2}\\s+${escaped})\\s*(?=\\n|$)`, 'gm')
  const matches = [...markdown.matchAll(pattern)]

  if (matches.length <= 1) {
    const plainPattern = new RegExp(
      `(^|\\n)(${escaped})\\s*(?=\\n|$)`,
      'gm',
    )
    const plainMatches = [...markdown.matchAll(plainPattern)]
    if (plainMatches.length <= 1) return markdown

    const lastPlain = plainMatches[plainMatches.length - 1]
    if (lastPlain?.index == null || lastPlain.index === 0) return markdown

    const tail = markdown.slice(lastPlain.index).trim()
    return tail.startsWith('#') ? tail : `# ${tail}`
  }

  const lastMatch = matches[matches.length - 1]
  if (lastMatch?.index == null || lastMatch.index === 0) return markdown

  return markdown.slice(lastMatch.index).trim()
}

export function normalizePageAiMarkdown(markdown: string) {
  let text = normalizeTaskAiMarkdown(markdown)
  text = stripLeadingCommentary(text)
  text = dedupeRepeatedDocument(text)
  text = stripTrailingCommentary(text)
  return normalizeTaskAiMarkdown(text)
}
