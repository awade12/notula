import iconNames from '@/features/workspace/lib/page-icon-search-index.json'
import { iconNameToLabel, iconNameToSlug } from '@/features/workspace/lib/page-icon-slug'

const SEARCH_INDEX = iconNames.map((iconName) => ({
  iconName,
  slug: iconNameToSlug(iconName),
  label: iconNameToLabel(iconName),
  searchText: `${iconName} ${iconNameToLabel(iconName)} ${iconNameToSlug(iconName)}`.toLowerCase(),
}))

export function searchPageIcons(query: string, limit = 72): Array<{ iconName: string; slug: string; label: string }> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const results: Array<{ iconName: string; slug: string; label: string }> = []

  for (const entry of SEARCH_INDEX) {
    if (entry.searchText.includes(trimmed)) {
      results.push({
        iconName: entry.iconName,
        slug: entry.slug,
        label: entry.label,
      })
      if (results.length >= limit) break
    }
  }

  return results
}

export const PAGE_ICON_LIBRARY_SIZE = iconNames.length
