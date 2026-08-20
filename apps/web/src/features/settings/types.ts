export type ThemePreset = 'dark' | 'light' | 'oled' | 'sepia' | 'midnight' | 'high-contrast'

export type UiFontId =
  | 'inter'
  | 'system'
  | 'dm-sans'
  | 'source-sans-3'
  | 'ibm-plex-sans'
  | 'outfit'
  | 'nunito-sans'
  | 'geist'

export type EditorFontId =
  | 'match-ui'
  | 'inter'
  | 'literata'
  | 'source-serif-4'
  | 'lora'
  | 'merriweather'
  | 'georgia'
  | 'jetbrains-mono'
  | 'iosevka'
  | 'fira-code'

export type UiScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type EditorFontSize = 14 | 15 | 16 | 17 | 18 | 20 | 22

export type EditorLineHeight = 'tight' | 'normal' | 'relaxed' | 'loose'

export type EditorWidth = 'narrow' | 'default' | 'wide' | 'full'

export type EditorAlignment = 'left' | 'center' | 'right'

export type BlockSpacing = 'tight' | 'normal' | 'relaxed'

export type AccentColor = 'neutral' | 'blue' | 'violet' | 'green' | 'amber' | 'rose'

export type ReducedMotionPref = 'system' | 'on' | 'off'

export type AppearancePreferences = {
  theme: ThemePreset
  uiFont: UiFontId
  uiScale: UiScale
  editorFont: EditorFontId
  editorFontSize: EditorFontSize
  editorLineHeight: EditorLineHeight
  editorWidth: EditorWidth
  editorAlignment: EditorAlignment
  blockSpacing: BlockSpacing
  accentColor: AccentColor
  letterSpacing: 'tight' | 'normal' | 'wide'
  spellCheck: boolean
  showPageIcons: boolean
  showConnectionBanner: boolean
  compactSidebar: boolean
  sidebarStartCollapsed: boolean
  showBlockHover: boolean
  showSideMenu: boolean
  linkUnderline: 'always' | 'hover' | 'never'
  confirmBeforeDelete: boolean
  openLinksInNewTab: boolean
  reducedMotion: ReducedMotionPref
  monospaceCodeBlocks: boolean
}

export type AppearancePreferenceKey = keyof AppearancePreferences
