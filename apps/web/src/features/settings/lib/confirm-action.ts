import { getAppearancePreferences } from '@/features/settings/stores/appearance-store'

export function shouldConfirmDelete(message: string) {
  if (!getAppearancePreferences().confirmBeforeDelete) return true
  return window.confirm(message)
}
