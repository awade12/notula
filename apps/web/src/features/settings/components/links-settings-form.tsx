import { useAppearancePreference } from '../hooks/use-appearance'
import { useUserPreferenceActions } from '../hooks/use-user-preferences'
import {
  SettingsResetBar,
  SettingsToggle,
} from './settings-controls'
import { SettingsSection } from './settings-section'

export function LinksSettingsForm() {
  const { preferences, setPreference, resetPreferences } = useUserPreferenceActions()
  const [openLinksInNewTab, setOpenLinksInNewTab] = useAppearancePreference('openLinksInNewTab')

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Links & mentions"
        description="How pages connect and open across the workspace."
      >
        <div className="space-y-3">
          <SettingsToggle
            checked={preferences.showBacklinks}
            onChange={(value) => setPreference('showBacklinks', value)}
            label="Show backlinks panel"
            description="List pages that link to the current page below the editor."
          />

          <SettingsToggle
            checked={openLinksInNewTab}
            onChange={setOpenLinksInNewTab}
            label="Open external links in new tab"
            description="URLs in page content open in a separate browser tab."
          />

          <SettingsToggle
            checked={preferences.openMentionsInNewTab}
            onChange={(value) => setPreference('openMentionsInNewTab', value)}
            label="Open @mentions in new tab"
            description="Page mentions navigate in a new tab instead of the current view."
          />
        </div>
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}
