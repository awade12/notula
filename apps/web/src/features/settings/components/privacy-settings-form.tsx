import { useUserPreferenceActions } from '../hooks/use-user-preferences'
import { clearDocStateCache, getDocStateCacheStats } from '@/lib/doc-state-cache'
import {
  SettingsResetBar,
  SettingsRow,
  SettingsSelect,
  SettingsSlider,
  SettingsToggle,
} from './settings-controls'
import { SettingsSection } from './settings-section'
import { setSidebarChromeExpanded } from '@/features/workspace/stores/sidebar-store'
import { useState } from 'react'

export function PrivacySettingsForm() {
  const { preferences, setPreference, resetPreferences } = useUserPreferenceActions()
  const [cacheStats, setCacheStats] = useState(() => getDocStateCacheStats())
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Local data"
        description="Notula keeps a small offline cache so recently opened pages reload faster."
      >
        <div className="space-y-5">
          <SettingsToggle
            checked={preferences.enableOfflineCache}
            onChange={(value) => setPreference('enableOfflineCache', value)}
            label="Enable offline page cache"
            description="Store recent Yjs document bytes in sessionStorage for faster reloads."
          />

          <SettingsRow label="Cache size" description="Maximum number of pages cached locally.">
            <SettingsSlider
              value={preferences.offlineCacheMaxPages}
              min={8}
              max={64}
              step={4}
              onChange={(value) => setPreference('offlineCacheMaxPages', value)}
              formatValue={(value) => `${value} pages`}
            />
          </SettingsRow>

          <div className="rounded-lg border border-border/70 bg-sidebar/20 px-4 py-3 text-[11px] text-text-primary/70">
            Currently cached: {cacheStats.count} page{cacheStats.count === 1 ? '' : 's'}
            {cacheStats.approxKb > 0 ? ` (~${cacheStats.approxKb} KB)` : ''}
          </div>

          <button
            type="button"
            onClick={() => {
              clearDocStateCache()
              setCacheStats(getDocStateCacheStats())
              setMessage('Local page cache cleared')
            }}
            className="rounded-lg border border-border px-3 py-2 text-xs tracking-dashboard text-text-primary hover:bg-white/5"
          >
            Clear local cache
          </button>

          {message ? <p className="text-meta text-emerald-400/90">{message}</p> : null}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sidebar defaults"
        description="Global defaults for favorites, recents, and sidebar sections."
      >
        <div className="space-y-5">
          <SettingsRow label="Recent pages limit" description="How many recent pages to remember.">
            <SettingsSelect
              value={String(preferences.recentPageLimit)}
              onChange={(value) => setPreference('recentPageLimit', Number(value))}
              options={[3, 5, 8, 10, 15].map((count) => ({
                value: String(count),
                label: `${count} pages`,
              }))}
            />
          </SettingsRow>

          <SettingsToggle
            checked={preferences.showFavoritesSection}
            onChange={(value) => setPreference('showFavoritesSection', value)}
            label="Show favorites section"
          />

          <SettingsToggle
            checked={preferences.showRecentSection}
            onChange={(value) => setPreference('showRecentSection', value)}
            label="Show recent section"
          />

          <SettingsToggle
            checked={preferences.favoritesExpandedDefault}
            onChange={(value) => setPreference('favoritesExpandedDefault', value)}
            label="Expand favorites by default"
          />

          <SettingsToggle
            checked={preferences.recentExpandedDefault}
            onChange={(value) => setPreference('recentExpandedDefault', value)}
            label="Expand recent by default"
          />

          <SettingsToggle
            checked={preferences.sidebarChromeExpandedDefault}
            onChange={(value) => {
              setPreference('sidebarChromeExpandedDefault', value)
              setSidebarChromeExpanded(value)
            }}
            label="Expand sidebar sections by default"
            description="Workspace picker and sidebar chrome panels start expanded."
          />
        </div>
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}
