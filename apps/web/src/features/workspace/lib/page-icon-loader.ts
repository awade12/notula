import type { IconSvgElement } from '@hugeicons/react'
import iconNames from '@/features/workspace/lib/page-icon-search-index.json'

const iconNameSet = new Set<string>(iconNames)

const iconModules = import.meta.glob('@hugeicons/core-free-icons/*Icon', {
  import: 'default',
}) as Record<string, () => Promise<IconSvgElement>>

const loadersByIconName = new Map<string, () => Promise<IconSvgElement>>()

for (const [modulePath, loader] of Object.entries(iconModules)) {
  const iconName = modulePath.slice(modulePath.lastIndexOf('/') + 1).replace(/\.js$/, '')
  loadersByIconName.set(iconName, loader)
}

export function iconExists(iconName: string): boolean {
  return iconNameSet.has(iconName) && loadersByIconName.has(iconName)
}

const cache = new Map<string, Promise<IconSvgElement>>()

export function loadIcon(iconName: string): Promise<IconSvgElement> {
  const cached = cache.get(iconName)
  if (cached) return cached

  const loader = loadersByIconName.get(iconName)
  if (!loader) {
    return Promise.reject(new Error(`Unknown icon: ${iconName}`))
  }

  const promise = loader()
  cache.set(iconName, promise)
  return promise
}
