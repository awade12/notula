import { useSyncExternalStore } from 'react'
import { getSidebarCollapsed, subscribeSidebarCollapsed } from '../stores/sidebar-store'

export function useSidebarCollapsed() {
  return useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsed,
    () => false,
  )
}
