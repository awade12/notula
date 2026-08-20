import { DEFAULT_PAGE_ICON_COLOR, normalizePageIconColor } from '@/features/workspace/lib/page-icon-colors'
import { isPageIconId, type PageIconId } from '@/features/workspace/lib/page-icon-registry'

const PAGE_ICON_PREFIX = 'hi:'

export type ParsedPageIcon =
  | { kind: 'hugeicon'; id: PageIconId; color: string }
  | { kind: 'legacy'; value: string }

export function encodePageIcon(id: PageIconId, color: string): string {
  const normalizedColor = normalizePageIconColor(color).replace(/^#/, '')
  return `${PAGE_ICON_PREFIX}${id}:${normalizedColor}`
}

export function parsePageIcon(value: string | null | undefined): ParsedPageIcon | null {
  if (!value) return null

  if (!value.startsWith(PAGE_ICON_PREFIX)) {
    return { kind: 'legacy', value }
  }

  const body = value.slice(PAGE_ICON_PREFIX.length)
  const separator = body.lastIndexOf(':')
  if (separator <= 0) {
    return { kind: 'legacy', value }
  }

  const id = body.slice(0, separator)
  const color = body.slice(separator + 1)
  if (!isPageIconId(id)) {
    return { kind: 'legacy', value }
  }

  return {
    kind: 'hugeicon',
    id,
    color: normalizePageIconColor(color.startsWith('#') ? color : `#${color}`),
  }
}

export function getPageIconDraft(value: string | null | undefined): {
  iconId: PageIconId | null
  color: string
} {
  const parsed = parsePageIcon(value)
  if (!parsed) {
    return { iconId: null, color: DEFAULT_PAGE_ICON_COLOR }
  }

  if (parsed.kind === 'legacy') {
    return { iconId: null, color: DEFAULT_PAGE_ICON_COLOR }
  }

  return { iconId: parsed.id, color: parsed.color }
}
