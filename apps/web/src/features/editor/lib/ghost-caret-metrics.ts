import type { NotesEditor } from './block-schema'

type ProsemirrorView = NonNullable<NotesEditor['prosemirrorView']>

export type GhostCaretMetrics = {
  left: number
  top: number
  height: number
  fontSize: string
  fontFamily: string
  lineHeight: string
  letterSpacing: string
  fontWeight: string
  fontStyle: string
  fontVariant: string
  textTransform: string
  fontKerning: string
  fontFeatureSettings: string
  webkitFontSmoothing: string
}

function getTextElement(view: ProsemirrorView, head: number): HTMLElement | null {
  const domAtPos = view.domAtPos(head)
  if (domAtPos.node.nodeType === Node.TEXT_NODE) {
    return domAtPos.node.parentElement
  }
  if (domAtPos.node instanceof HTMLElement) {
    return domAtPos.node
  }
  return null
}

function getTypographySource(view: ProsemirrorView, head: number): HTMLElement | null {
  const textEl = getTextElement(view, head)
  return textEl?.closest<HTMLElement>('.bn-inline-content') ?? textEl ?? view.dom.closest<HTMLElement>('.bn-editor')
}

export function getTextPrefixBeforeCursorFromView(view: ProsemirrorView): string {
  const { $from, empty } = view.state.selection
  if (!empty) return ''

  const blockStart = $from.start()
  return view.state.doc.textBetween(blockStart, $from.pos, '\n')
}

export function getGhostCaretMetrics(view: ProsemirrorView, head: number): GhostCaretMetrics | null {
  if (!view.dom.isConnected) return null

  const coords = view.coordsAtPos(head)
  const styleSource = getTypographySource(view, head)
  if (!styleSource) return null

  const computed = getComputedStyle(styleSource)
  const caretHeight = Math.max(coords.bottom - coords.top, 1)

  return {
    left: coords.left,
    top: coords.top,
    height: caretHeight,
    fontSize: computed.fontSize,
    fontFamily: computed.fontFamily,
    lineHeight: `${caretHeight}px`,
    letterSpacing: computed.letterSpacing,
    fontWeight: computed.fontWeight,
    fontStyle: computed.fontStyle,
    fontVariant: computed.fontVariant,
    textTransform: computed.textTransform,
    fontKerning: computed.fontKerning,
    fontFeatureSettings: computed.fontFeatureSettings,
    webkitFontSmoothing: computed.getPropertyValue('-webkit-font-smoothing') || 'antialiased',
  }
}
