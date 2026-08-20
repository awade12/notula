export const PAGE_ICON_COLORS = [
  { id: 'gray', value: '#a1a1a1' },
  { id: 'white', value: '#ffffff' },
  { id: 'red', value: '#f87171' },
  { id: 'orange', value: '#fb923c' },
  { id: 'yellow', value: '#facc15' },
  { id: 'green', value: '#4ade80' },
  { id: 'blue', value: '#60a5fa' },
  { id: 'purple', value: '#a78bfa' },
  { id: 'pink', value: '#f472b6' },
  { id: 'cyan', value: '#22d3ee' },
] as const

export type PageIconColor = (typeof PAGE_ICON_COLORS)[number]['value']

export const DEFAULT_PAGE_ICON_COLOR: PageIconColor = PAGE_ICON_COLORS[0].value

export function normalizePageIconColor(color: string): PageIconColor | string {
  const hex = color.replace(/^#/, '').toLowerCase()
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/.test(hex)) {
    return DEFAULT_PAGE_ICON_COLOR
  }

  if (hex.length === 3) {
    return `#${hex
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`
  }

  return `#${hex.slice(0, 6)}`
}
