import type { Theme } from '@blocknote/mantine'
import { getEditorFont, getUiFont } from '@/features/settings/lib/font-catalog'
import { THEME_PRESETS } from '@/features/settings/lib/theme-presets'
import { getAppearancePreferences } from '@/features/settings/stores/appearance-store'

export function buildEditorTheme(): Theme {
  const prefs = getAppearancePreferences()
  const colors = THEME_PRESETS[prefs.theme] ?? THEME_PRESETS.dark
  const editorFont =
    prefs.editorFont === 'match-ui'
      ? getUiFont(prefs.uiFont).family
      : getEditorFont(prefs.editorFont).family

  return {
    colors: {
      editor: {
        text: colors.textEmphasis,
        background: colors.surface,
      },
      menu: {
        text: colors.textEmphasis,
        background: colors.sidebar,
      },
      tooltip: {
        text: colors.textEmphasis,
        background: colors.sidebar,
      },
      hovered: {
        text: colors.textEmphasis,
        background: 'rgb(255 255 255 / 0.06)',
      },
      selected: {
        text: colors.textEmphasis,
        background: 'rgb(255 255 255 / 0.08)',
      },
      disabled: {
        text: colors.textPrimary,
        background: colors.surface,
      },
      shadow: '#000000',
      border: colors.border,
      sideMenu: colors.textPrimary,
    },
    borderRadius: 6,
    fontFamily: editorFont,
  }
}

export const notesEditorTheme = buildEditorTheme()
