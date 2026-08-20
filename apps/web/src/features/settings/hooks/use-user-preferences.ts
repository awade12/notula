import { useSyncExternalStore } from 'react'
import {
  getUserPreferences,
  resetUserPreferences,
  setUserPreference,
  setUserPreferences,
  subscribeUserPreferences,
} from '../stores/preferences-store'
import type { UserPreferenceKey, UserPreferences } from '../preferences-types'

export function useUserPreferences(): UserPreferences {
  return useSyncExternalStore(
    subscribeUserPreferences,
    getUserPreferences,
    getUserPreferences,
  )
}

export function useUserPreferenceActions() {
  const preferences = useUserPreferences()

  return {
    preferences,
    setPreference: setUserPreference,
    setPreferences: setUserPreferences,
    resetPreferences: resetUserPreferences,
  }
}

export function useUserPreference<K extends UserPreferenceKey>(
  key: K,
): [UserPreferences[K], (value: UserPreferences[K]) => void] {
  const preferences = useUserPreferences()
  return [preferences[key], (value) => setUserPreference(key, value)]
}
