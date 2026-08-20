import type { NotesEditor } from './block-schema'

export type GhostCompletionState = {
  suggestion: string
  isLoading: boolean
}

export const DEFAULT_GHOST_COMPLETION_STATE: GhostCompletionState = {
  suggestion: '',
  isLoading: false,
}

const stateByEditor = new WeakMap<NotesEditor, GhostCompletionState>()
const listenersByEditor = new WeakMap<NotesEditor, Set<() => void>>()

function notifyGhostCompletionListeners(editor: NotesEditor) {
  listenersByEditor.get(editor)?.forEach((listener) => listener())
}

export function subscribeGhostCompletion(editor: NotesEditor, listener: () => void) {
  const listeners = listenersByEditor.get(editor) ?? new Set()
  listeners.add(listener)
  listenersByEditor.set(editor, listeners)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      listenersByEditor.delete(editor)
    }
  }
}

export function getGhostCompletionState(editor: NotesEditor): GhostCompletionState {
  return stateByEditor.get(editor) ?? DEFAULT_GHOST_COMPLETION_STATE
}

export function setGhostCompletionState(
  editor: NotesEditor,
  partial: Partial<GhostCompletionState>,
) {
  const current = getGhostCompletionState(editor)
  stateByEditor.set(editor, { ...current, ...partial })
  notifyGhostCompletionListeners(editor)
}

export function clearGhostCompletionState(editor: NotesEditor) {
  setGhostCompletionState(editor, { suggestion: '', isLoading: false })
}

export function getTextPrefixBeforeCursor(editor: NotesEditor): string {
  const tiptap = editor._tiptapEditor
  const { state } = tiptap
  const { $from, empty } = state.selection
  if (!empty) return ''

  const blockStart = $from.start()
  return state.doc.textBetween(blockStart, $from.pos, '\n')
}
