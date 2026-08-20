import type { UserPreferences } from '../preferences-types'

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  searchDebounceMs: 300,
  searchMaxResults: 30,
  searchMode: 'hybrid',
  searchScope: 'all',
  searchHotkey: 'mod+k',
  toggleSidebarHotkey: 'mod+b',
  newPageHotkey: 'mod+shift+n',
  showRemoteCursors: true,
  showCollaboratorNames: true,
  cursorLabelMode: 'activity',
  showBacklinks: true,
  openMentionsInNewTab: false,
  enableOfflineCache: true,
  offlineCacheMaxPages: 32,
  recentPageLimit: 5,
  showFavoritesSection: true,
  showRecentSection: true,
  favoritesExpandedDefault: true,
  recentExpandedDefault: false,
  sidebarChromeExpandedDefault: false,
}
