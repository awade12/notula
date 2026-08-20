import { useEffect } from 'react'
import { applyAppearancePreferences } from '../lib/apply-appearance'
import { applyUserPreferences } from '../lib/apply-user-preferences'
import { getAppearancePreferences, subscribeAppearancePreferences } from '../stores/appearance-store'
import { getUserPreferences, subscribeUserPreferences } from '../stores/preferences-store'
import { setSidebarCollapsed, setSidebarChromeExpanded } from '@/features/workspace/stores/sidebar-store'

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyAppearancePreferences()
    applyUserPreferences()

    if (getAppearancePreferences().sidebarStartCollapsed) {
      setSidebarCollapsed(true)
    }

    if (getUserPreferences().sidebarChromeExpandedDefault) {
      setSidebarChromeExpanded(true)
    }

    const unsubscribeAppearance = subscribeAppearancePreferences(() => {
      applyAppearancePreferences()
    })
    const unsubscribePreferences = subscribeUserPreferences(() => {
      applyUserPreferences()
    })

    return () => {
      unsubscribeAppearance()
      unsubscribePreferences()
    }
  }, [])

  return children
}
