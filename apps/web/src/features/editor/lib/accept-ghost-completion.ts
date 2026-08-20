import type { NotesEditor } from './block-schema'
import { getTextPrefixBeforeCursorFromView } from './ghost-caret-metrics'
import { formatGhostCompletionText } from './ghost-completion-text'
import {
  clearGhostCompletionState,
  getGhostCompletionState,
  getTextPrefixBeforeCursor,
} from './ghost-completion-store'

export function acceptGhostCompletion(editor: NotesEditor): boolean {
  const { suggestion } = getGhostCompletionState(editor)
  const trimmed = suggestion.trim()
  if (!trimmed) return false

  const prefix =
    editor.prosemirrorView != null
      ? getTextPrefixBeforeCursorFromView(editor.prosemirrorView)
      : getTextPrefixBeforeCursor(editor)
  const text = formatGhostCompletionText(prefix, trimmed)
  if (!text) return false

  editor.focus()
  editor.insertInlineContent([{ type: 'text', text, styles: {} }], {
    updateSelection: true,
  })
  clearGhostCompletionState(editor)
  return true
}
