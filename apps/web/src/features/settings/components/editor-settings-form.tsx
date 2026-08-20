import { useAppearanceActions } from '../hooks/use-appearance'
import { EditorFontPicker, EditorTypographyPreview } from './appearance-settings-form'
import {
  SettingsResetBar,
  SettingsRow,
  SettingsSelect,
  SettingsSlider,
  SettingsToggle,
} from './settings-controls'
import { SettingsSection } from './settings-section'
import type { BlockSpacing, EditorAlignment, EditorFontSize, EditorLineHeight, EditorWidth } from '../types'

const editorSizeOptions: Array<{ value: string; label: string }> = [
  { value: '14', label: '14px — Compact' },
  { value: '15', label: '15px — Small' },
  { value: '16', label: '16px — Default' },
  { value: '17', label: '17px — Comfortable' },
  { value: '18', label: '18px — Large' },
  { value: '20', label: '20px — Extra large' },
  { value: '22', label: '22px — Presentation' },
]

const lineHeightOptions: Array<{ value: EditorLineHeight; label: string }> = [
  { value: 'tight', label: 'Tight (1.45)' },
  { value: 'normal', label: 'Normal (1.65)' },
  { value: 'relaxed', label: 'Relaxed (1.85)' },
  { value: 'loose', label: 'Loose (2.0)' },
]

const widthOptions: Array<{ value: EditorWidth; label: string }> = [
  { value: 'narrow', label: 'Narrow (640px)' },
  { value: 'default', label: 'Default (720px)' },
  { value: 'wide', label: 'Wide (860px)' },
  { value: 'full', label: 'Full width' },
]

const alignmentOptions: Array<{ value: EditorAlignment; label: string }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center (default)' },
  { value: 'right', label: 'Right' },
]

const spacingOptions: Array<{ value: BlockSpacing; label: string }> = [
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
]

const linkUnderlineOptions = [
  { value: 'hover', label: 'On hover' },
  { value: 'always', label: 'Always' },
  { value: 'never', label: 'Never' },
]

export function EditorSettingsForm() {
  const { preferences, setPreference, resetPreferences } = useAppearanceActions()

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Editor typography"
        description="Separate from the UI — tune how page content reads."
      >
        <div className="space-y-5">
          <SettingsRow label="Editor font" description="Serif, sans, or mono — independent of the UI font.">
            <EditorFontPicker />
          </SettingsRow>

          <SettingsRow label="Body text size" description="Base size for paragraphs in the editor.">
            <SettingsSelect
              value={String(preferences.editorFontSize)}
              onChange={(value) => setPreference('editorFontSize', Number(value) as EditorFontSize)}
              options={editorSizeOptions}
            />
          </SettingsRow>

          <SettingsRow label="Line height" description="Vertical rhythm between lines of text.">
            <SettingsSelect
              value={preferences.editorLineHeight}
              onChange={(value) => setPreference('editorLineHeight', value as EditorLineHeight)}
              options={lineHeightOptions}
            />
          </SettingsRow>

          <SettingsRow
            label="Fine-tune size"
            description="Slide for in-between sizes — snaps to the nearest pixel."
          >
            <SettingsSlider
              value={preferences.editorFontSize}
              min={14}
              max={22}
              step={1}
              onChange={(value) => setPreference('editorFontSize', value as EditorFontSize)}
              formatValue={(value) => `${value}px body text`}
            />
          </SettingsRow>

          <EditorTypographyPreview />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Layout & blocks"
        description="Control page width, spacing between blocks, and editor chrome."
      >
        <div className="space-y-5">
          <SettingsRow label="Content width" description="How wide the editor column is on a page.">
            <SettingsSelect
              value={preferences.editorWidth}
              onChange={(value) => setPreference('editorWidth', value as EditorWidth)}
              options={widthOptions}
            />
          </SettingsRow>

          <SettingsRow
            label="Page alignment"
            description="Where the editor column sits in the main content area."
          >
            <SettingsSelect
              value={preferences.editorAlignment}
              onChange={(value) => setPreference('editorAlignment', value as EditorAlignment)}
              options={alignmentOptions}
            />
          </SettingsRow>

          <SettingsRow label="Block spacing" description="Gap between paragraphs and blocks.">
            <SettingsSelect
              value={preferences.blockSpacing}
              onChange={(value) => setPreference('blockSpacing', value as BlockSpacing)}
              options={spacingOptions}
            />
          </SettingsRow>

          <SettingsToggle
            checked={preferences.showBlockHover}
            onChange={(value) => setPreference('showBlockHover', value)}
            label="Highlight row on hover"
            description="Subtle background when your pointer is over a block."
          />

          <SettingsToggle
            checked={preferences.showSideMenu}
            onChange={(value) => setPreference('showSideMenu', value)}
            label="Show block handle menu"
            description="Drag handle and plus button on the left of each block."
          />

          <SettingsToggle
            checked={preferences.monospaceCodeBlocks}
            onChange={(value) => setPreference('monospaceCodeBlocks', value)}
            label="Monospace code blocks"
            description="Use a fixed-width font inside code blocks."
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Writing aids"
        description="Spell check, links, and other editor behavior."
      >
        <div className="space-y-3">
          <SettingsToggle
            checked={preferences.spellCheck}
            onChange={(value) => setPreference('spellCheck', value)}
            label="Spell check"
            description="Browser spell checking while you type."
          />

          <SettingsRow label="Link underlines" description="How links appear in page content.">
            <SettingsSelect
              value={preferences.linkUnderline}
              onChange={(value) =>
                setPreference('linkUnderline', value as typeof preferences.linkUnderline)
              }
              options={linkUnderlineOptions}
            />
          </SettingsRow>

          <SettingsToggle
            checked={preferences.openLinksInNewTab}
            onChange={(value) => setPreference('openLinksInNewTab', value)}
            label="Open links in new tab"
            description="External links open in a separate browser tab."
          />
        </div>
      </SettingsSection>

      <SettingsResetBar onReset={resetPreferences} />
    </div>
  )
}
