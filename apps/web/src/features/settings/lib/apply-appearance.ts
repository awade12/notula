import { DEFAULT_APPEARANCE } from '../lib/appearance-defaults'
import { ensureFontLoaded, getEditorFont, getUiFont } from '../lib/font-catalog'
import {
  ACCENT_COLORS,
  BLOCK_SPACING_PX,
  EDITOR_LINE_HEIGHT_VALUES,
  EDITOR_WIDTH_PX,
  LETTER_SPACING_VALUES,
  THEME_PRESETS,
  UI_SCALE_PX,
} from '../lib/theme-presets'
import { getAppearancePreferences } from '../stores/appearance-store'
import type { AppearancePreferences } from '../types'

export function applyAppearancePreferences(prefs: AppearancePreferences = getAppearancePreferences()) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const theme = THEME_PRESETS[prefs.theme] ?? THEME_PRESETS.dark
  const uiFont = getUiFont(prefs.uiFont)
  const editorFontDef = getEditorFont(prefs.editorFont)
  const editorFontFamily =
    prefs.editorFont === 'match-ui' ? uiFont.family : editorFontDef.family
  const accent = ACCENT_COLORS[prefs.accentColor] ?? ACCENT_COLORS.neutral
  const uiScale = UI_SCALE_PX[prefs.uiScale] ?? UI_SCALE_PX.md

  ensureFontLoaded(uiFont)
  if (prefs.editorFont !== 'match-ui') {
    ensureFontLoaded(editorFontDef)
  }

  root.dataset.theme = prefs.theme
  root.dataset.uiScale = prefs.uiScale
  root.dataset.editorWidth = prefs.editorWidth
  root.dataset.editorAlignment = prefs.editorAlignment
  root.dataset.compactSidebar = String(prefs.compactSidebar)
  root.dataset.showBlockHover = String(prefs.showBlockHover)
  root.dataset.showSideMenu = String(prefs.showSideMenu)
  root.dataset.linkUnderline = prefs.linkUnderline
  root.dataset.reducedMotion = prefs.reducedMotion
  root.dataset.monospaceCode = String(prefs.monospaceCodeBlocks)
  root.style.colorScheme = theme.colorScheme

  root.style.setProperty('--font-sans', uiFont.family)
  root.style.setProperty('--text-sm', uiScale.sm)
  root.style.setProperty('--text-meta', uiScale.meta)
  root.style.setProperty('--text-2xl', uiScale.xl)
  root.style.setProperty('--tracking-dashboard', LETTER_SPACING_VALUES[prefs.letterSpacing])
  root.style.setProperty('--color-sidebar', theme.sidebar)
  root.style.setProperty('--color-surface', theme.surface)
  root.style.setProperty('--color-surface-muted', theme.surface)
  root.style.setProperty('--color-text-emphasis', theme.textEmphasis)
  root.style.setProperty('--color-text-primary', theme.textPrimary)
  root.style.setProperty('--color-border', theme.border)
  root.style.setProperty('--color-accent-link', accent.link)
  root.style.setProperty('--color-accent-selection', accent.selection)
  root.style.setProperty('--editor-font-family', editorFontFamily)
  root.style.setProperty('--editor-font-size', `${prefs.editorFontSize}px`)
  root.style.setProperty(
    '--editor-line-height',
    String(EDITOR_LINE_HEIGHT_VALUES[prefs.editorLineHeight]),
  )
  root.style.setProperty('--editor-max-width', `${EDITOR_WIDTH_PX[prefs.editorWidth]}px`)
  root.style.setProperty('--editor-block-spacing', `${BLOCK_SPACING_PX[prefs.blockSpacing]}px`)

  document.body.spellcheck = prefs.spellCheck
}

export function getInitialAppearanceScript() {
  const defaults = JSON.stringify(DEFAULT_APPEARANCE)
  return `(function(){try{var p=Object.assign(${defaults},JSON.parse(localStorage.getItem('notesapp:appearance')||'{}'));var t={dark:{sidebar:'#181818',surface:'#141414',textEmphasis:'#ffffff',textPrimary:'#a1a1a1',border:'#2a2a2a',colorScheme:'dark'},light:{sidebar:'#f4f4f5',surface:'#ffffff',textEmphasis:'#18181b',textPrimary:'#71717a',border:'#e4e4e7',colorScheme:'light'},oled:{sidebar:'#000000',surface:'#000000',textEmphasis:'#ffffff',textPrimary:'#8a8a8a',border:'#1a1a1a',colorScheme:'dark'},sepia:{sidebar:'#1c1917',surface:'#1a1714',textEmphasis:'#f5ebe0',textPrimary:'#a89984',border:'#3d342b',colorScheme:'dark'},midnight:{sidebar:'#0f1419',surface:'#0c1015',textEmphasis:'#e7ecf3',textPrimary:'#8b9cb3',border:'#1e2a3a',colorScheme:'dark'},'high-contrast':{sidebar:'#000000',surface:'#000000',textEmphasis:'#ffffff',textPrimary:'#cccccc',border:'#ffffff',colorScheme:'dark'}};var th=t[p.theme]||t.dark;var r=document.documentElement;r.dataset.theme=p.theme;r.style.colorScheme=th.colorScheme;r.style.setProperty('--color-sidebar',th.sidebar);r.style.setProperty('--color-surface',th.surface);r.style.setProperty('--color-text-emphasis',th.textEmphasis);r.style.setProperty('--color-text-primary',th.textPrimary);r.style.setProperty('--color-border',th.border);}catch(e){}})();`
}
