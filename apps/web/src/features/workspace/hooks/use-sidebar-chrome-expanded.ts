import { useSyncExternalStore } from 'react'
import {
  getSidebarChromeExpanded,
  subscribeSidebarChromeExpanded,
} from '../stores/sidebar-store'

export function useSidebarChromeExpanded() {
  return useSyncExternalStore(
    subscribeSidebarChromeExpanded,
    getSidebarChromeExpanded,
    () => false,
  )
}
