function joinOrphanHeadingMarkers(text: string) {
  const lines = text.split('\n')
  const output: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()
    const markerOnly = trimmed.match(/^(#{1,6})$/)

    if (markerOnly) {
      let j = i + 1
      while (j < lines.length && !(lines[j]?.trim())) j++
      const next = lines[j]?.trim() ?? ''
      if (next && !/^#{1,6}\s/.test(next)) {
        output.push(`${markerOnly[1]} ${next}`)
        i = j
        continue
      }
    }

    output.push(line)
  }

  return output.join('\n')
}

function collapseDuplicateHeadingMarkers(text: string) {
  return text.replace(/^(#{1,6})\s+\1\s+/gm, '$1 ')
}

function ensureHeadingSpaces(text: string) {
  return text.replace(/(^|\n)(#{1,6})([^\s#\n])/g, '$1$2 $3')
}

function splitInlineSectionLabels(text: string) {
  return text.replace(/\s*\*\*([^*]+)\*\*:\s*/g, '\n\n## $1\n\n')
}

function stripDescriptionPrefix(text: string) {
  return text.replace(/^Markdown:\s*/i, '')
}

export function normalizeTaskAiMarkdown(markdown: string) {
  let text = markdown.replace(/\r\n/g, '\n').trim()
  if (!text) return ''

  text = stripDescriptionPrefix(text)
  text = text.replace(/\\n/g, '\n')
  text = splitInlineSectionLabels(text)
  text = collapseDuplicateHeadingMarkers(text)
  text = ensureHeadingSpaces(text)
  text = text.replace(/([^\n#])(#{1,6}\s)/g, '$1\n\n$2')
  text = text.replace(/([^\n])(- \*\*)/g, '$1\n$2')
  text = text.replace(/([^\n])(- ")/g, '$1\n$2')
  text = joinOrphanHeadingMarkers(text)

  return text.replace(/\n{3,}/g, '\n\n').trim()
}
