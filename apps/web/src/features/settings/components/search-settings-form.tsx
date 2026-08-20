import { useUserPreferenceActions } from '../hooks/use-user-preferences'
import {
  SettingsResetBar,
  SettingsRow,
  SettingsSelect,
  SettingsSlider,
} from './settings-controls'
import { SettingsSection } from './settings-section'
import type { SearchMode, SearchScope } from '../preferences-types'

const modeOptions = [
  { value: 'keyword', label: 'Keyword only' },
  { value: 'hybrid', label: 'Hybrid (keyword + semantic)' },
  { value: 'semantic', label: 'Semantic only' },
]

const scopeOptions: Array<{ value: SearchScope; label: string }> = [
  { value: 'all', label: 'All pages' },
  { value: 'notes', label: 'Notes only' },
  { value: 'folders', label: 'Folders only' },
]

export function SearchSettingsForm() {
  const { preferences, setPreference, resetPreferences } = useUserPreferenceActions()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Search behavior"
        description="Control how ⌘K search queries the workspace."
      >
        <div className="space-y-5">
          <SettingsRow label="Search mode" description="Hybrid merges keyword and vector results.">
            <SettingsSelect
              value={preferences.searchMode}
              onChange={(value) => setPreference('searchMode', value as SearchMode)}
              options={modeOptions}
            />
          </SettingsRow>

          <SettingsRow label="Scope" description="Limit which page kinds appear in results.">
            <SettingsSelect
              value={preferences.searchScope}
              onChange={(value) => setPreference('searchScope', value as SearchScope)}
              options={scopeOptions}
            />
          </SettingsRow>

          <SettingsRow label="Debounce" description="Wait before firing a search request.">
            <SettingsSlider
              value={preferences.searchDebounceMs}
              min={0}
              max={800}
              step={50}
              onChange={(value) => setPreference('searchDebounceMs', value)}
              formatValue={(value) => `${value}ms delay`}
            />
          </SettingsRow>

          <SettingsRow label="Max results" description="Maximum rows returned per query.">
            <SettingsSlider
              value={preferences.searchMaxResults}
              min={10}
              max={50}
              step={5}
              onChange={(value) => setPreference('searchMaxResults', value)}
              formatValue={(value) => `${value} results`}
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}
