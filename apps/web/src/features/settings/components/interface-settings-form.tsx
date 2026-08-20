import { useAppearanceActions } from '../hooks/use-appearance'
import {
  SettingsResetBar,
  SettingsSelect,
  SettingsToggle,
} from './settings-controls'
import { SettingsSection } from './settings-section'
import type { ReducedMotionPref } from '../types'

const reducedMotionOptions: Array<{ value: ReducedMotionPref; label: string }> = [
  { value: 'system', label: 'Use system setting' },
  { value: 'on', label: 'Reduce motion' },
  { value: 'off', label: 'Full motion' },
]

export function InterfaceSettingsForm() {
  const { preferences, setPreference, resetPreferences } = useAppearanceActions()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Sidebar"
        description="How the workspace navigation behaves when you open Notula."
      >
        <div className="space-y-3">
          <SettingsToggle
            checked={preferences.compactSidebar}
            onChange={(value) => setPreference('compactSidebar', value)}
            label="Compact sidebar rows"
            description="Tighter spacing between pages in the sidebar tree."
          />

          <SettingsToggle
            checked={preferences.sidebarStartCollapsed}
            onChange={(value) => setPreference('sidebarStartCollapsed', value)}
            label="Start with sidebar collapsed"
            description="Opens the app with more room for content."
          />

          <SettingsToggle
            checked={preferences.showPageIcons}
            onChange={(value) => setPreference('showPageIcons', value)}
            label="Show page icons"
            description="Display emoji or icon prefixes in the page tree."
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Editor chrome"
        description="Status indicators and overlays while editing."
      >
        <div className="space-y-3">
          <SettingsToggle
            checked={preferences.showConnectionBanner}
            onChange={(value) => setPreference('showConnectionBanner', value)}
            label="Connection alerts"
            description="Show a notice when you're offline or reconnecting. Nothing appears while synced."
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Motion & safety"
        description="Accessibility and confirmation preferences."
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-meta tracking-dashboard text-text-primary">
              Animation preference
            </span>
            <SettingsSelect
              value={preferences.reducedMotion}
              onChange={(value) => setPreference('reducedMotion', value as ReducedMotionPref)}
              options={reducedMotionOptions}
            />
          </label>

          <SettingsToggle
            checked={preferences.confirmBeforeDelete}
            onChange={(value) => setPreference('confirmBeforeDelete', value)}
            label="Confirm before deleting pages"
            description="Ask before permanently removing a page from the workspace."
          />
        </div>
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}
