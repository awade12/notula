export type SearchMode = 'keyword' | 'hybrid' | 'semantic'

export type SearchScope = 'all' | 'notes' | 'folders'

export type CursorLabelMode = 'activity' | 'always' | 'never'

export type HotkeyBinding = 'mod+k' | 'mod+shift+k' | 'mod+p' | 'none'

export type UserPreferences = {
  searchDebounceMs: number
  searchMaxResults: number
  searchMode: SearchMode
  searchScope: SearchScope
  searchHotkey: HotkeyBinding
  toggleSidebarHotkey: 'mod+b' | 'mod+\\' | 'none'
  newPageHotkey: 'mod+shift+n' | 'mod+n' | 'none'
  showRemoteCursors: boolean
  showCollaboratorNames: boolean
  cursorLabelMode: CursorLabelMode
  showBacklinks: boolean
  openMentionsInNewTab: boolean
  enableOfflineCache: boolean
  offlineCacheMaxPages: number
  recentPageLimit: number
  showFavoritesSection: boolean
  showRecentSection: boolean
  favoritesExpandedDefault: boolean
  recentExpandedDefault: boolean
  sidebarChromeExpandedDefault: boolean
}

export type UserPreferenceKey = keyof UserPreferences

import type { AiFeatureFlags } from '@/features/ai/lib/feature-flags'

export type AiSettings = {
  defaultModel: string
  enableEmbeddings: boolean
  hasApiKey: boolean
  apiKeyHint: string | null
  featureFlags: AiFeatureFlags
}
