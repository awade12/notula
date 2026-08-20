import { createExtension } from '@blocknote/core'
import type { NotesEditor } from './block-schema'
import { acceptGhostCompletion } from './accept-ghost-completion'
import { clearGhostCompletionState, getGhostCompletionState } from './ghost-completion-store'

export const ghostCompletionExtension = createExtension(({ editor }) => {
  const notesEditor = editor as NotesEditor

  return {
    key: 'ghostCompletion',
    runsBefore: ['keyboardShortcuts'],
    keyboardShortcuts: {
      Tab: () => acceptGhostCompletion(notesEditor),
      Escape: () => {
        const { suggestion, isLoading } = getGhostCompletionState(notesEditor)
        if (!suggestion && !isLoading) return false
        clearGhostCompletionState(notesEditor)
        return true
      },
    },
  }
})
