import iconNames from '@/features/workspace/lib/page-icon-search-index.json'

const iconNameSet = new Set<string>(iconNames)

export function iconExists(iconName: string): boolean {
  return iconNameSet.has(iconName)
}

export async function loadIcon(iconName: string) {
  const { loadIcon: loadClientIcon } = await import(
    '@/features/workspace/lib/page-icon-loader.client'
  )
  return loadClientIcon(iconName)
}
