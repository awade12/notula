import type { IconSvgElement } from '@hugeicons/react'
import {
  iconExists as hugeiconsIconExists,
  loadIcon as hugeiconsLoadIcon,
} from '@hugeicons/core-free-icons/loader'
import iconNames from '@/features/workspace/lib/page-icon-search-index.json'

const iconNameSet = new Set<string>(iconNames)

export function iconExists(iconName: string): boolean {
  return iconNameSet.has(iconName) && hugeiconsIconExists(iconName)
}

export function loadIcon(iconName: string): Promise<IconSvgElement> {
  if (!iconExists(iconName)) {
    return Promise.reject(new Error(`Unknown icon: ${iconName}`))
  }

  return hugeiconsLoadIcon(iconName)
}
