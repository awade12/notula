import '@tanstack/react-start/client-only'
import type { IconSvgElement } from '@hugeicons/react'
import iconNames from '@/features/workspace/lib/page-icon-search-index.json'

const iconNameSet = new Set<string>(iconNames)

type HugeiconsLoader = typeof import('@hugeicons/core-free-icons/loader')

let loaderPromise: Promise<HugeiconsLoader> | null = null

function getLoader() {
  if (!loaderPromise) {
    loaderPromise = import('@hugeicons/core-free-icons/loader')
  }
  return loaderPromise
}

export function iconExists(iconName: string): boolean {
  return iconNameSet.has(iconName)
}

const cache = new Map<string, Promise<IconSvgElement>>()

export async function loadIcon(iconName: string): Promise<IconSvgElement> {
  const cached = cache.get(iconName)
  if (cached) return cached

  const promise = getLoader().then(async ({ loadIcon: loadHugeIcon, iconExists: hugeIconExists }) => {
    if (!hugeIconExists(iconName)) {
      throw new Error(`Unknown icon: ${iconName}`)
    }
    return (await loadHugeIcon(iconName)) as IconSvgElement
  })

  cache.set(iconName, promise)
  return promise
}
