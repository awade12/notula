import { DEFAULT_USER_PREFERENCES } from '../lib/preferences-defaults'
import type { UserPreferenceKey, UserPreferences } from '../preferences-types'

const STORAGE_KEY = 'notesapp:preferences'

let preferences: UserPreferences = { ...DEFAULT_USER_PREFERENCES }
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function readPreferences(): UserPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_USER_PREFERENCES }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_USER_PREFERENCES }
    return { ...DEFAULT_USER_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) }
  } catch {
    return { ...DEFAULT_USER_PREFERENCES }
  }
}

function persistPreferences(next: UserPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Browsing can continue when storage is unavailable.
  }
}

if (typeof window !== 'undefined') {
  preferences = readPreferences()
}

export function getUserPreferences(): UserPreferences {
  return preferences
}

export function setUserPreference<K extends UserPreferenceKey>(
  key: K,
  value: UserPreferences[K],
) {
  if (preferences[key] === value) return
  preferences = { ...preferences, [key]: value }
  persistPreferences(preferences)
  emit()
}

export function setUserPreferences(next: Partial<UserPreferences>) {
  preferences = { ...preferences, ...next }
  persistPreferences(preferences)
  emit()
}

export function resetUserPreferences() {
  preferences = { ...DEFAULT_USER_PREFERENCES }
  persistPreferences(preferences)
  emit()
}

export function subscribeUserPreferences(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
