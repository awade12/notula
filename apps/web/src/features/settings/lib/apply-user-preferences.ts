import { getUserPreferences } from '../stores/preferences-store'
import type { UserPreferences } from '../preferences-types'

export function applyUserPreferences(prefs: UserPreferences = getUserPreferences()) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.showRemoteCursors = String(prefs.showRemoteCursors)
  root.dataset.showCollaboratorNames = String(prefs.showCollaboratorNames)
  root.dataset.cursorLabelMode = prefs.cursorLabelMode
}
