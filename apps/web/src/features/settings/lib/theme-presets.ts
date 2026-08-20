import type { AccentColor, ThemePreset } from '../types'

export type ThemeColors = {
  sidebar: string
  surface: string
  textEmphasis: string
  textPrimary: string
  border: string
  colorScheme: 'dark' | 'light'
}

export const THEME_PRESETS: Record<ThemePreset, ThemeColors> = {
  dark: {
    sidebar: '#181818',
    surface: '#141414',
    textEmphasis: '#ffffff',
    textPrimary: '#a1a1a1',
    border: '#2a2a2a',
    colorScheme: 'dark',
  },
  light: {
    sidebar: '#f4f4f5',
    surface: '#ffffff',
    textEmphasis: '#18181b',
    textPrimary: '#71717a',
    border: '#e4e4e7',
    colorScheme: 'light',
  },
  oled: {
    sidebar: '#000000',
    surface: '#000000',
    textEmphasis: '#ffffff',
    textPrimary: '#8a8a8a',
    border: '#1a1a1a',
    colorScheme: 'dark',
  },
  sepia: {
    sidebar: '#1c1917',
    surface: '#1a1714',
    textEmphasis: '#f5ebe0',
    textPrimary: '#a89984',
    border: '#3d342b',
    colorScheme: 'dark',
  },
  midnight: {
    sidebar: '#0f1419',
    surface: '#0c1015',
    textEmphasis: '#e7ecf3',
    textPrimary: '#8b9cb3',
    border: '#1e2a3a',
    colorScheme: 'dark',
  },
  'high-contrast': {
    sidebar: '#000000',
    surface: '#000000',
    textEmphasis: '#ffffff',
    textPrimary: '#cccccc',
    border: '#ffffff',
    colorScheme: 'dark',
  },
}

export const THEME_LABELS: Record<ThemePreset, string> = {
  dark: 'Dark',
  light: 'Light',
  oled: 'OLED black',
  sepia: 'Sepia',
  midnight: 'Midnight',
  'high-contrast': 'High contrast',
}

export const ACCENT_COLORS: Record<
  AccentColor,
  { label: string; link: string; selection: string; swatch: string }
> = {
  neutral: {
    label: 'Neutral',
    link: 'rgb(255 255 255 / 0.7)',
    selection: 'rgb(255 255 255 / 0.14)',
    swatch: '#a1a1a1',
  },
  blue: {
    label: 'Blue',
    link: '#6ba3ff',
    selection: 'rgb(107 163 255 / 0.22)',
    swatch: '#6ba3ff',
  },
  violet: {
    label: 'Violet',
    link: '#a78bfa',
    selection: 'rgb(167 139 250 / 0.22)',
    swatch: '#a78bfa',
  },
  green: {
    label: 'Green',
    link: '#5fd65f',
    selection: 'rgb(95 214 95 / 0.2)',
    swatch: '#5fd65f',
  },
  amber: {
    label: 'Amber',
    link: '#e69819',
    selection: 'rgb(230 152 25 / 0.22)',
    swatch: '#e69819',
  },
  rose: {
    label: 'Rose',
    link: '#f7768e',
    selection: 'rgb(247 118 142 / 0.22)',
    swatch: '#f7768e',
  },
}

export const UI_SCALE_PX = {
  xs: { sm: '12px', meta: '11px', xl: '20px' },
  sm: { sm: '13px', meta: '12px', xl: '22px' },
  md: { sm: '14px', meta: '13px', xl: '24px' },
  lg: { sm: '15px', meta: '14px', xl: '26px' },
  xl: { sm: '16px', meta: '15px', xl: '28px' },
} as const

export const EDITOR_LINE_HEIGHT_VALUES = {
  tight: 1.45,
  normal: 1.65,
  relaxed: 1.85,
  loose: 2,
} as const

export const EDITOR_WIDTH_PX = {
  narrow: 640,
  default: 720,
  wide: 860,
  full: 9999,
} as const

export const BLOCK_SPACING_PX = {
  tight: 1,
  normal: 3,
  relaxed: 6,
} as const

export const LETTER_SPACING_VALUES = {
  tight: '-0.3px',
  normal: '-0.15px',
  wide: '0px',
} as const
