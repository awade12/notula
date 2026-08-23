export function extractUncheckedChecklistItems(plaintext: string) {
  return plaintext
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^-\s+\[\s\]\s+/.test(line))
    .map((line) => line.replace(/^-\s+\[\s\]\s+/, '').trim())
    .filter(Boolean)
}

export function extractChecklistSectionItems(plaintext: string, sectionHeading: string) {
  const lines = plaintext.replace(/\r\n/g, '\n').split('\n')
  const target = sectionHeading.toLowerCase()
  const items: string[] = []
  let inSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    const headingMatch = trimmed.match(/^#{1,3}\s+(.*)$/)
    if (headingMatch) {
      inSection = headingMatch[1]?.trim().toLowerCase() === target
      continue
    }

    if (!inSection) continue
    if (/^-\s+\[\s\]\s+/.test(trimmed)) {
      items.push(trimmed.replace(/^-\s+\[\s\]\s+/, '').trim())
    }
  }

  return items.filter(Boolean)
}
