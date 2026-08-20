import { useUserPreferenceActions } from '../hooks/use-user-preferences'
import {
  SettingsResetBar,
  SettingsRow,
  SettingsSelect,
  SettingsToggle,
} from './settings-controls'
import { SettingsSection } from './settings-section'

const cursorLabelOptions = [
  { value: 'activity', label: 'While typing' },
  { value: 'always', label: 'Always show names' },
  { value: 'never', label: 'Never show names' },
]

export function CollaborationSettingsForm() {
  const { preferences, setPreference, resetPreferences } = useUserPreferenceActions()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Live collaboration"
        description="Control how other editors appear while you share a page."
      >
        <div className="space-y-5">
          <SettingsToggle
            checked={preferences.showRemoteCursors}
            onChange={(value) => setPreference('showRemoteCursors', value)}
            label="Show remote cursors"
            description="Display collaborator carets and selection highlights."
          />

          <SettingsToggle
            checked={preferences.showCollaboratorNames}
            onChange={(value) => setPreference('showCollaboratorNames', value)}
            label="Show collaborator names"
            description="Name labels on remote cursors when enabled."
          />

          <SettingsRow label="Cursor labels" description="When collaborator names appear.">
            <SettingsSelect
              value={preferences.cursorLabelMode}
              onChange={(value) =>
                setPreference('cursorLabelMode', value as typeof preferences.cursorLabelMode)
              }
              options={cursorLabelOptions}
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}
