const SPACE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#14b8a6',
  '#f97316',
] as const

export function spaceAccentColor(name: string) {
  let hash = 0
  for (const char of name) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  }
  return SPACE_COLORS[Math.abs(hash) % SPACE_COLORS.length] ?? SPACE_COLORS[0]
}

export function spaceInitial(name: string) {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]?.toUpperCase() : '?'
}
