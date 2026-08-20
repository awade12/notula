import { createExtension, getBlockInfoFromSelection } from '@blocknote/core'

const INLINE_CARD_BLOCK_TYPES = new Set(['callout', 'knowledge'])

export const inlineCardLineBreakExtension = createExtension({
  key: 'inline-card-line-break',
  runsBefore: ['keyboardShortcuts'],
  keyboardShortcuts: {
    'Shift-Enter': ({ editor }) => {
      const tiptap = editor._tiptapEditor
      const { state } = tiptap
      const blockInfo = getBlockInfoFromSelection(state)

      if (!blockInfo.isBlockContainer) {
        return false
      }

      if (!INLINE_CARD_BLOCK_TYPES.has(blockInfo.blockNoteType)) {
        return false
      }

      if (state.selection.$from.nodeBefore?.type.name === 'hardBreak') {
        return true
      }

      const hardBreak = state.schema.nodes.hardBreak
      if (!hardBreak) {
        return false
      }

      editor.transact((tr) => {
        const marks =
          tr.storedMarks ??
          tr.selection.$head
            .marks()
            .filter((mark) =>
              tiptap.extensionManager.splittableMarks.includes(mark.type.name),
            )

        tr.insert(tr.selection.head, hardBreak.create()).ensureMarks(marks)
      })

      return true
    },
  },
})
