import { useCallback, useEffect, useState } from 'react'
import { getUserPreferences } from '@/features/settings/stores/preferences-store'

type SidebarPagePreferences = {
  favoriteIds: string[]
  recentIds: string[]
  recentExpanded: boolean
  favoritesExpanded: boolean
}

type StoredPreferences = SidebarPagePreferences & {
  loaded: boolean
  spaceId: string
}

function readGlobalSidebarDefaults(): Pick<
  SidebarPagePreferences,
  'recentExpanded' | 'favoritesExpanded'
> {
  const prefs = getUserPreferences()
  return {
    recentExpanded: prefs.recentExpandedDefault,
    favoritesExpanded: prefs.favoritesExpandedDefault,
  }
}

const EMPTY_PREFERENCES: SidebarPagePreferences = {
  favoriteIds: [],
  recentIds: [],
  ...readGlobalSidebarDefaults(),
}

function storageKey(spaceId: string) {
  return `notesapp:sidebar-pages:${spaceId}`
}

function readPreferences(spaceId: string): SidebarPagePreferences {
  try {
    const raw = window.localStorage.getItem(storageKey(spaceId))
    if (!raw) return EMPTY_PREFERENCES

    const parsed = JSON.parse(raw) as Partial<SidebarPagePreferences>
    const defaults = readGlobalSidebarDefaults()
    return {
      favoriteIds: Array.isArray(parsed.favoriteIds) ? parsed.favoriteIds : [],
      recentIds: Array.isArray(parsed.recentIds) ? parsed.recentIds : [],
      recentExpanded:
        typeof parsed.recentExpanded === 'boolean'
          ? parsed.recentExpanded
          : defaults.recentExpanded,
      favoritesExpanded:
        typeof parsed.favoritesExpanded === 'boolean'
          ? parsed.favoritesExpanded
          : defaults.favoritesExpanded,
    }
  } catch {
    return EMPTY_PREFERENCES
  }
}

export function useSidebarPagePreferences(spaceId: string) {
  const [preferences, setPreferences] = useState<StoredPreferences>({
    ...EMPTY_PREFERENCES,
    loaded: false,
    spaceId: '',
  })

  useEffect(() => {
    const stored = readPreferences(spaceId)
    setPreferences({ ...stored, loaded: true, spaceId })
  }, [spaceId])

  useEffect(() => {
    if (!preferences.loaded || preferences.spaceId !== spaceId) return

    try {
      window.localStorage.setItem(
        storageKey(spaceId),
        JSON.stringify({
          favoriteIds: preferences.favoriteIds,
          recentIds: preferences.recentIds,
          recentExpanded: preferences.recentExpanded,
          favoritesExpanded: preferences.favoritesExpanded,
        }),
      )
    } catch {
      // Browsing can continue when storage is unavailable.
    }
  }, [preferences, spaceId])

  const toggleFavorite = useCallback(
    (pageId: string) => {
      setPreferences((current) => {
        const base = current.spaceId === spaceId
          ? current
          : { ...EMPTY_PREFERENCES, loaded: true, spaceId }
        const isFavorite = base.favoriteIds.includes(pageId)

        return {
          ...base,
          favoriteIds: isFavorite
            ? base.favoriteIds.filter((id) => id !== pageId)
            : [pageId, ...base.favoriteIds],
        }
      })
    },
    [spaceId],
  )

  const recordRecent = useCallback(
    (pageId: string) => {
      setPreferences((current) => {
        if (!current.loaded || current.spaceId !== spaceId) return current
        return {
          ...current,
          recentIds: [pageId, ...current.recentIds.filter((id) => id !== pageId)].slice(
            0,
            getUserPreferences().recentPageLimit,
          ),
        }
      })
    },
    [spaceId],
  )

  const prunePageIds = useCallback(
    (validIds: Set<string>) => {
      setPreferences((current) => {
        if (!current.loaded || current.spaceId !== spaceId) return current
        const favoriteIds = current.favoriteIds.filter((id) => validIds.has(id))
        const recentIds = current.recentIds.filter((id) => validIds.has(id))
        if (
          favoriteIds.length === current.favoriteIds.length
          && recentIds.length === current.recentIds.length
        ) {
          return current
        }
        return {
          ...current,
          favoriteIds,
          recentIds,
          recentExpanded: recentIds.length > 0 ? current.recentExpanded : false,
        }
      })
    },
    [spaceId],
  )

  const toggleRecentExpanded = useCallback(() => {
    setPreferences((current) => {
      if (!current.loaded || current.spaceId !== spaceId) return current
      return { ...current, recentExpanded: !current.recentExpanded }
    })
  }, [spaceId])

  const toggleFavoritesExpanded = useCallback(() => {
    setPreferences((current) => {
      if (!current.loaded || current.spaceId !== spaceId) return current
      return { ...current, favoritesExpanded: !current.favoritesExpanded }
    })
  }, [spaceId])

  const isCurrentSpace = preferences.loaded && preferences.spaceId === spaceId

  return {
    favoriteIds: isCurrentSpace ? preferences.favoriteIds : [],
    recentIds: isCurrentSpace ? preferences.recentIds : [],
    recentExpanded: isCurrentSpace ? preferences.recentExpanded : false,
    favoritesExpanded: isCurrentSpace ? preferences.favoritesExpanded : true,
    isLoaded: isCurrentSpace,
    toggleFavorite,
    recordRecent,
    prunePageIds,
    toggleRecentExpanded,
    toggleFavoritesExpanded,
  }
}
