import { useUserPreferenceActions } from '../hooks/use-user-preferences'
import { formatHotkeyLabel } from '../lib/hotkeys'
import { SettingsResetBar, SettingsRow, SettingsSelect } from './settings-controls'
import { SettingsSection } from './settings-section'

const searchHotkeyOptions = [
  { value: 'mod+k', label: formatHotkeyLabel('mod+k') },
  { value: 'mod+shift+k', label: formatHotkeyLabel('mod+shift+k') },
  { value: 'mod+p', label: formatHotkeyLabel('mod+p') },
  { value: 'none', label: 'Disabled' },
]

const sidebarHotkeyOptions = [
  { value: 'mod+b', label: formatHotkeyLabel('mod+b') },
  { value: 'mod+\\', label: formatHotkeyLabel('mod+\\') },
  { value: 'none', label: 'Disabled' },
]

const newPageHotkeyOptions = [
  { value: 'mod+shift+n', label: formatHotkeyLabel('mod+shift+n') },
  { value: 'mod+n', label: formatHotkeyLabel('mod+n') },
  { value: 'none', label: 'Disabled' },
]

export function ShortcutsSettingsForm() {
  const { preferences, setPreference, resetPreferences } = useUserPreferenceActions()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Keyboard shortcuts"
        description="Customize global shortcuts. Editor shortcuts like / and @ are fixed."
      >
        <div className="space-y-5">
          <SettingsRow label="Open search" description="Quick find across the current space.">
            <SettingsSelect
              value={preferences.searchHotkey}
              onChange={(value) =>
                setPreference('searchHotkey', value as typeof preferences.searchHotkey)
              }
              options={searchHotkeyOptions}
            />
          </SettingsRow>

          <SettingsRow label="Toggle sidebar" description="Show or hide the page tree.">
            <SettingsSelect
              value={preferences.toggleSidebarHotkey}
              onChange={(value) =>
                setPreference('toggleSidebarHotkey', value as typeof preferences.toggleSidebarHotkey)
              }
              options={sidebarHotkeyOptions}
            />
          </SettingsRow>

          <SettingsRow label="New page" description="Create a page in the current folder.">
            <SettingsSelect
              value={preferences.newPageHotkey}
              onChange={(value) =>
                setPreference('newPageHotkey', value as typeof preferences.newPageHotkey)
              }
              options={newPageHotkeyOptions}
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      <SettingsSection title="Reference" description="Built-in editor shortcuts.">
        <ul className="space-y-2 text-sm text-text-primary">
          <li><span className="text-text-emphasis">/</span> — insert blocks</li>
          <li><span className="text-text-emphasis">@</span> — mention a page</li>
          <li><span className="text-text-emphasis">Select text</span> — formatting toolbar</li>
        </ul>
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}
