import { DEFAULT_APPEARANCE } from '../lib/appearance-defaults'
import type { AppearancePreferenceKey, AppearancePreferences } from '../types'

const STORAGE_KEY = 'notesapp:appearance'

let preferences: AppearancePreferences = { ...DEFAULT_APPEARANCE }
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function isUiScale(value: unknown): value is AppearancePreferences['uiScale'] {
  return value === 'xs' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl'
}

function isTheme(value: unknown): value is AppearancePreferences['theme'] {
  return (
    value === 'dark' ||
    value === 'light' ||
    value === 'oled' ||
    value === 'sepia' ||
    value === 'midnight' ||
    value === 'high-contrast'
  )
}

function parseStoredPreferences(raw: string | null): AppearancePreferences {
  if (!raw) return { ...DEFAULT_APPEARANCE }

  try {
    const parsed = JSON.parse(raw) as Partial<AppearancePreferences>
    return { ...DEFAULT_APPEARANCE, ...parsed }
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

function readPreferences(): AppearancePreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_APPEARANCE }

  try {
    return parseStoredPreferences(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

function persistPreferences(next: AppearancePreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Browsing can continue when storage is unavailable.
  }
}

if (typeof window !== 'undefined') {
  preferences = readPreferences()
}

export function getAppearancePreferences(): AppearancePreferences {
  return preferences
}

export function setAppearancePreference<K extends AppearancePreferenceKey>(
  key: K,
  value: AppearancePreferences[K],
) {
  if (preferences[key] === value) return
  preferences = { ...preferences, [key]: value }
  persistPreferences(preferences)
  emit()
}

export function setAppearancePreferences(next: Partial<AppearancePreferences>) {
  preferences = { ...preferences, ...next }
  persistPreferences(preferences)
  emit()
}

export function resetAppearancePreferences() {
  preferences = { ...DEFAULT_APPEARANCE }
  persistPreferences(preferences)
  emit()
}

export function subscribeAppearancePreferences(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isValidUiScale(value: unknown): value is AppearancePreferences['uiScale'] {
  return isUiScale(value)
}

export function isValidTheme(value: unknown): value is AppearancePreferences['theme'] {
  return isTheme(value)
}
