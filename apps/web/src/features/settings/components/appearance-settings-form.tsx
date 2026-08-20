import { EDITOR_FONTS, ensureFontLoaded, getEditorFont, getUiFont, UI_FONTS } from '../lib/font-catalog'
import { ACCENT_COLORS, THEME_LABELS } from '../lib/theme-presets'
import { useAppearanceActions } from '../hooks/use-appearance'
import {
  SettingsChoiceGrid,
  SettingsFontPreview,
  SettingsResetBar,
  SettingsRow,
  SettingsSelect,
} from './settings-controls'
import { SettingsSection } from './settings-section'
import type { AccentColor, ThemePreset, UiFontId, UiScale } from '../types'

const uiScaleOptions: Array<{ value: UiScale; label: string }> = [
  { value: 'xs', label: 'Extra small (12px)' },
  { value: 'sm', label: 'Small (13px)' },
  { value: 'md', label: 'Medium (14px)' },
  { value: 'lg', label: 'Large (15px)' },
  { value: 'xl', label: 'Extra large (16px)' },
]

const letterSpacingOptions = [
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
]

export function AppearanceSettingsForm() {
  const { preferences, setPreference, resetPreferences } = useAppearanceActions()
  const uiFont = getUiFont(preferences.uiFont)

  const themeOptions = (Object.keys(THEME_LABELS) as ThemePreset[]).map((theme) => ({
    value: theme,
    label: THEME_LABELS[theme],
    preview: (
      <span
        className="mb-2 block h-8 w-full rounded-md border border-white/10"
        style={{
          background:
            theme === 'light'
              ? 'linear-gradient(135deg, #ffffff 50%, #f4f4f5 50%)'
              : theme === 'sepia'
                ? 'linear-gradient(135deg, #1a1714 50%, #3d342b 50%)'
                : theme === 'midnight'
                  ? 'linear-gradient(135deg, #0c1015 50%, #1e2a3a 50%)'
                  : theme === 'high-contrast'
                    ? 'linear-gradient(135deg, #000 50%, #fff 50%)'
                    : 'linear-gradient(135deg, #141414 50%, #181818 50%)',
        }}
      />
    ),
  }))

  const accentOptions = (Object.keys(ACCENT_COLORS) as AccentColor[]).map((accent) => ({
    value: accent,
    label: ACCENT_COLORS[accent].label,
    preview: (
      <span
        className="mb-2 block size-5 rounded-full border border-white/10"
        style={{ background: ACCENT_COLORS[accent].swatch }}
      />
    ),
  }))

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Theme"
        description="Choose a color scheme for the whole app. Changes apply instantly."
      >
        <SettingsChoiceGrid
          value={preferences.theme}
          onChange={(value) => setPreference('theme', value)}
          options={themeOptions}
          columns={3}
        />
      </SettingsSection>

      <SettingsSection
        title="Interface font"
        description="The typeface used across navigation, settings, and chrome."
      >
        <div className="space-y-5">
          <SettingsRow label="Font family" description="Applied to sidebar, menus, and settings.">
            <SettingsSelect
              value={preferences.uiFont}
              onChange={(value) => {
                const next = value as UiFontId
                ensureFontLoaded(getUiFont(next))
                setPreference('uiFont', next)
              }}
              options={UI_FONTS.map((font) => ({ value: font.id, label: font.label }))}
            />
          </SettingsRow>

          <SettingsRow label="Base text size" description="Scales labels, navigation, and UI copy.">
            <SettingsSelect
              value={preferences.uiScale}
              onChange={(value) => setPreference('uiScale', value as UiScale)}
              options={uiScaleOptions}
            />
          </SettingsRow>

          <SettingsRow label="Letter spacing" description="Adjust how tight or open UI text feels.">
            <SettingsSelect
              value={preferences.letterSpacing}
              onChange={(value) =>
                setPreference('letterSpacing', value as typeof preferences.letterSpacing)
              }
              options={letterSpacingOptions}
            />
          </SettingsRow>

          <SettingsFontPreview family={uiFont.family} label="UI preview" />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Accent color"
        description="Tints links, selections, and focus highlights in the editor."
      >
        <SettingsChoiceGrid
          value={preferences.accentColor}
          onChange={(value) => setPreference('accentColor', value)}
          options={accentOptions}
          columns={3}
        />
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}

export function EditorTypographyPreview() {
  const { preferences } = useAppearanceActions()
  const editorFont =
    preferences.editorFont === 'match-ui'
      ? getUiFont(preferences.uiFont).family
      : getEditorFont(preferences.editorFont).family

  return (
    <SettingsFontPreview
      family={editorFont}
      label="Editor preview"
      sample="Writing should feel exactly the way you want it."
    />
  )
}

export function EditorFontPicker() {
  const { preferences, setPreference } = useAppearanceActions()

  return (
    <SettingsSelect
      value={preferences.editorFont}
      onChange={(value) => {
        const next = value as typeof preferences.editorFont
        ensureFontLoaded(getEditorFont(next))
        setPreference('editorFont', next)
      }}
      options={EDITOR_FONTS.map((font) => ({ value: font.id, label: font.label }))}
    />
  )
}
