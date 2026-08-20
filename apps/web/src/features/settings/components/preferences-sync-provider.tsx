import { useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import {
  getAppearancePreferences,
  setAppearancePreferences,
  subscribeAppearancePreferences,
} from '@/features/settings/stores/appearance-store'
import {
  getUserPreferences,
  setUserPreferences,
  subscribeUserPreferences,
} from '@/features/settings/stores/preferences-store'

let syncInitialized = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void apiFetch('/api/settings/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appearance: getAppearancePreferences(),
        user: getUserPreferences(),
      }),
    })
  }, 800)
}

export function PreferencesSyncProvider({ children }: { children: React.ReactNode }) {
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    void (async () => {
      const response = await apiFetch('/api/settings/preferences')
      if (!response.ok) return

      const data = (await response.json()) as {
        appearance?: Record<string, unknown>
        user?: Record<string, unknown>
      }

      if (data.appearance && Object.keys(data.appearance).length > 0) {
        setAppearancePreferences(data.appearance as Parameters<typeof setAppearancePreferences>[0])
      }

      if (data.user && Object.keys(data.user).length > 0) {
        setUserPreferences(data.user as Parameters<typeof setUserPreferences>[0])
      }
    })()
  }, [])

  useEffect(() => {
    if (syncInitialized) return
    syncInitialized = true

    const unsubAppearance = subscribeAppearancePreferences(() => scheduleSave())
    const unsubPrefs = subscribeUserPreferences(() => scheduleSave())

    return () => {
      unsubAppearance()
      unsubPrefs()
      if (saveTimer) clearTimeout(saveTimer)
    }
  }, [])

  return children
}
