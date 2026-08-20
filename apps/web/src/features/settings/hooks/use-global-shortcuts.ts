import { useEffect } from 'react'
import { bindHotkey } from '@/features/settings/lib/hotkeys'
import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'
import { toggleSidebarCollapsed } from '@/features/workspace/stores/sidebar-store'

export function useToggleSidebarHotkey() {
  const { toggleSidebarHotkey } = useUserPreferences()

  useEffect(() => {
    return bindHotkey(toggleSidebarHotkey, toggleSidebarCollapsed)
  }, [toggleSidebarHotkey])
}

export function useNewPageHotkey(onNewPage?: () => void) {
  const { newPageHotkey } = useUserPreferences()

  useEffect(() => {
    if (!onNewPage || newPageHotkey === 'none') return
    return bindHotkey(newPageHotkey, onNewPage)
  }, [newPageHotkey, onNewPage])
}

export function useGlobalShortcuts(options: { onNewPage?: () => void }) {
  useToggleSidebarHotkey()
  useNewPageHotkey(options.onNewPage)
}
