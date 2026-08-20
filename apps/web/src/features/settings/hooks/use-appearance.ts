import { useSyncExternalStore } from 'react'
import {
  getAppearancePreferences,
  resetAppearancePreferences,
  setAppearancePreference,
  setAppearancePreferences,
  subscribeAppearancePreferences,
} from '../stores/appearance-store'
import type { AppearancePreferenceKey, AppearancePreferences } from '../types'

export function useAppearancePreferences(): AppearancePreferences {
  return useSyncExternalStore(
    subscribeAppearancePreferences,
    getAppearancePreferences,
    getAppearancePreferences,
  )
}

export function useAppearancePreference<K extends AppearancePreferenceKey>(
  key: K,
): [AppearancePreferences[K], (value: AppearancePreferences[K]) => void] {
  const preferences = useAppearancePreferences()
  return [
    preferences[key],
    (value) => setAppearancePreference(key, value),
  ]
}

export function useAppearanceActions() {
  const preferences = useAppearancePreferences()

  return {
    preferences,
    setPreference: setAppearancePreference,
    setPreferences: setAppearancePreferences,
    resetPreferences: resetAppearancePreferences,
  }
}
