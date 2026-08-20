import type { EditorFontId, UiFontId } from '../types'

export type FontDefinition = {
  id: UiFontId | EditorFontId
  label: string
  family: string
  category: 'sans' | 'serif' | 'mono' | 'system'
  googleUrl?: string
}

export const UI_FONTS: FontDefinition[] = [
  {
    id: 'inter',
    label: 'Inter',
    family: '"Inter", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  },
  {
    id: 'system',
    label: 'System',
    family: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    category: 'system',
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    family: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap',
  },
  {
    id: 'source-sans-3',
    label: 'Source Sans 3',
    family: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap',
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    family: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap',
  },
  {
    id: 'outfit',
    label: 'Outfit',
    family: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap',
  },
  {
    id: 'nunito-sans',
    label: 'Nunito Sans',
    family: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600&display=swap',
  },
  {
    id: 'geist',
    label: 'Geist',
    family: '"Geist", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap',
  },
]

export const EDITOR_FONTS: FontDefinition[] = [
  {
    id: 'match-ui',
    label: 'Match UI font',
    family: 'var(--font-sans)',
    category: 'system',
  },
  {
    id: 'inter',
    label: 'Inter',
    family: '"Inter", ui-sans-serif, system-ui, sans-serif',
    category: 'sans',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  },
  {
    id: 'literata',
    label: 'Literata',
    family: '"Literata", Georgia, "Times New Roman", serif',
    category: 'serif',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Literata:wght@400;500;600&display=swap',
  },
  {
    id: 'source-serif-4',
    label: 'Source Serif 4',
    family: '"Source Serif 4", Georgia, "Times New Roman", serif',
    category: 'serif',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600&display=swap',
  },
  {
    id: 'lora',
    label: 'Lora',
    family: '"Lora", Georgia, "Times New Roman", serif',
    category: 'serif',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    family: '"Merriweather", Georgia, "Times New Roman", serif',
    category: 'serif',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
  },
  {
    id: 'georgia',
    label: 'Georgia',
    family: 'Georgia, "Times New Roman", serif',
    category: 'serif',
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    category: 'mono',
    googleUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
  },
  {
    id: 'iosevka',
    label: 'Iosevka',
    family: '"Iosevka", ui-monospace, SFMono-Regular, Menlo, monospace',
    category: 'mono',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Iosevka:wght@400;500&display=swap',
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    family: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace',
    category: 'mono',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap',
  },
]

const fontById = new Map<string, FontDefinition>(
  [...UI_FONTS, ...EDITOR_FONTS].map((font) => [font.id, font]),
)

export function getUiFont(id: UiFontId): FontDefinition {
  return fontById.get(id) ?? UI_FONTS[0]!
}

export function getEditorFont(id: EditorFontId): FontDefinition {
  return fontById.get(id) ?? EDITOR_FONTS[0]!
}

const loadedFontUrls = new Set<string>()

export function ensureFontLoaded(font: FontDefinition) {
  if (!font.googleUrl || typeof document === 'undefined') return
  if (loadedFontUrls.has(font.googleUrl)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = font.googleUrl
  document.head.appendChild(link)
  loadedFontUrls.add(font.googleUrl)
}
