import { useEffect } from 'react'
import { bindHotkey } from '@/features/settings/lib/hotkeys'
import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'

export function useSearchHotkey(onOpen: () => void) {
  const { searchHotkey } = useUserPreferences()

  useEffect(() => {
    return bindHotkey(searchHotkey, onOpen)
  }, [onOpen, searchHotkey])
}
