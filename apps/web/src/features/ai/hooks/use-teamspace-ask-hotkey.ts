import { useEffect } from 'react'
import { bindHotkey } from '@/features/settings/lib/hotkeys'

export function useTeamspaceAskHotkey(enabled: boolean, onOpen: () => void) {
  useEffect(() => {
    if (!enabled) return
    return bindHotkey('mod+shift+k', onOpen)
  }, [enabled, onOpen])
}
