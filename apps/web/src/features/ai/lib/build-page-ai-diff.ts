export type PageAiDiffLine = {
  type: 'same' | 'add' | 'remove'
  text: string
}

function normalizeLines(text: string) {
  return text.replace(/\r\n/g, '\n').split('\n')
}

function lcsTable(before: string[], after: string[]) {
  const rows = before.length + 1
  const cols = after.length + 1
  const table = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (before[i - 1] === after[j - 1]) {
        table[i]![j] = (table[i - 1]![j - 1] ?? 0) + 1
      } else {
        table[i]![j] = Math.max(table[i - 1]![j] ?? 0, table[i]![j - 1] ?? 0)
      }
    }
  }

  return table
}

export function buildPageAiLineDiff(before: string, after: string): PageAiDiffLine[] {
  const beforeLines = normalizeLines(before)
  const afterLines = normalizeLines(after)
  const table = lcsTable(beforeLines, afterLines)

  const diff: PageAiDiffLine[] = []
  let i = beforeLines.length
  let j = afterLines.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      diff.push({ type: 'same', text: beforeLines[i - 1] ?? '' })
      i--
      j--
      continue
    }

    if (j > 0 && (i === 0 || (table[i]![j - 1] ?? 0) >= (table[i - 1]![j] ?? 0))) {
      diff.push({ type: 'add', text: afterLines[j - 1] ?? '' })
      j--
      continue
    }

    if (i > 0) {
      diff.push({ type: 'remove', text: beforeLines[i - 1] ?? '' })
      i--
    }
  }

  return diff.reverse()
}

export function summarizePageAiDiff(diff: PageAiDiffLine[]) {
  const added = diff.filter((line) => line.type === 'add').length
  const removed = diff.filter((line) => line.type === 'remove').length
  return { added, removed }
}

export function collapsePageAiDiff(diff: PageAiDiffLine[], contextLines = 2) {
  const changedIndexes = new Set<number>()
  diff.forEach((line, index) => {
    if (line.type !== 'same') changedIndexes.add(index)
  })

  if (changedIndexes.size === 0) return diff

  const visible = new Set<number>()
  for (const index of changedIndexes) {
    for (let offset = -contextLines; offset <= contextLines; offset++) {
      const next = index + offset
      if (next >= 0 && next < diff.length) visible.add(next)
    }
  }

  const collapsed: PageAiDiffLine[] = []
  let skipped = false

  diff.forEach((line, index) => {
    if (visible.has(index)) {
      if (skipped) {
        collapsed.push({ type: 'same', text: '…' })
        skipped = false
      }
      collapsed.push(line)
      return
    }

    skipped = true
  })

  return collapsed
}
