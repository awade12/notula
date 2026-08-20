import { useEditorChange } from '@blocknote/react'
import { useCallback, useEffect, useSyncExternalStore, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { NotesEditor } from '@/features/editor/lib/block-schema'
import {
  getGhostCaretMetrics,
  getTextPrefixBeforeCursorFromView,
} from '@/features/editor/lib/ghost-caret-metrics'
import { formatGhostCompletionText } from '@/features/editor/lib/ghost-completion-text'
import {
  DEFAULT_GHOST_COMPLETION_STATE,
  getGhostCompletionState,
  subscribeGhostCompletion,
} from '@/features/editor/lib/ghost-completion-store'

type GhostRenderState = {
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
  displayText: string
}

function getScrollParents(element: HTMLElement | null) {
  const parents: HTMLElement[] = []
  let node = element?.parentElement ?? null

  while (node) {
    const style = getComputedStyle(node)
    if (/(auto|scroll|overlay)/.test(style.overflowY + style.overflowX)) {
      parents.push(node)
    }
    node = node.parentElement
  }

  return parents
}

export function GhostCompletionInline({ editor }: { editor: NotesEditor }) {
  const state = useSyncExternalStore(
    (listener) => subscribeGhostCompletion(editor, listener),
    () => getGhostCompletionState(editor),
    () => DEFAULT_GHOST_COMPLETION_STATE,
  )
  const [renderState, setRenderState] = useState<GhostRenderState | null>(null)

  const updatePosition = useCallback(() => {
    const view = editor.prosemirrorView
    if (!view) {
      setRenderState(null)
      return
    }

    const { head, empty } = view.state.selection
    const ghostText = state.suggestion.trim()
    if (!empty || (!ghostText && !state.isLoading)) {
      setRenderState(null)
      return
    }

    const metrics = getGhostCaretMetrics(view, head)
    if (!metrics) {
      setRenderState(null)
      return
    }

    const prefix = getTextPrefixBeforeCursorFromView(view)
    const displayText = ghostText ? formatGhostCompletionText(prefix, ghostText) : '…'

    setRenderState({
      left: metrics.left,
      top: metrics.top,
      height: metrics.height,
      fontSize: metrics.fontSize,
      fontFamily: metrics.fontFamily,
      lineHeight: metrics.lineHeight,
      letterSpacing: metrics.letterSpacing,
      fontWeight: metrics.fontWeight,
      fontStyle: metrics.fontStyle,
      fontVariant: metrics.fontVariant,
      textTransform: metrics.textTransform,
      fontKerning: metrics.fontKerning,
      fontFeatureSettings: metrics.fontFeatureSettings,
      webkitFontSmoothing: metrics.webkitFontSmoothing,
      displayText,
    })
  }, [editor, state.isLoading, state.suggestion])

  useEditorChange(updatePosition, editor)

  useEffect(() => {
    updatePosition()
  }, [updatePosition, state])

  useEffect(() => {
    const view = editor.prosemirrorView
    if (!view) return

    const scrollParents = getScrollParents(view.dom)
    scrollParents.forEach((node) => {
      node.addEventListener('scroll', updatePosition, { passive: true })
    })
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })

    return () => {
      scrollParents.forEach((node) => {
        node.removeEventListener('scroll', updatePosition)
      })
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [editor, updatePosition])

  if (!renderState) {
    return null
  }

  const overlay = (
    <span
      className="notes-ghost-completion notes-ghost-completion--inline"
      aria-hidden
      style={{
        position: 'fixed',
        left: renderState.left,
        top: renderState.top,
        height: renderState.height,
        fontSize: renderState.fontSize,
        fontFamily: renderState.fontFamily,
        lineHeight: renderState.lineHeight,
        letterSpacing: renderState.letterSpacing,
        fontWeight: renderState.fontWeight,
        fontStyle: renderState.fontStyle,
        fontVariant: renderState.fontVariant,
        textTransform: renderState.textTransform,
        fontKerning: renderState.fontKerning as CSSProperties['fontKerning'],
        fontFeatureSettings: renderState.fontFeatureSettings,
        WebkitFontSmoothing: renderState.webkitFontSmoothing,
        zIndex: 40,
        pointerEvents: 'none',
        margin: 0,
        padding: 0,
        border: 0,
      }}
    >
      {renderState.displayText}
    </span>
  )

  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body)
}
