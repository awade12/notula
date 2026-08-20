import { createExtension } from '@blocknote/core'
import { Plugin } from 'prosemirror-state'

function createArrowTypographyPlugin() {
  return new Plugin({
    props: {
      handleTextInput(view, from, to, text) {
        if (text !== '>') return false

        const { state } = view
        if (from < 1) return false

        const $from = state.doc.resolve(from)
        if ($from.parent.type.spec.code) return false

        const before = state.doc.textBetween(from - 1, from)
        if (before !== '-') return false

        view.dispatch(state.tr.insertText('→', from - 1, to))
        return true
      },
    },
  })
}

export const typographyShortcutsExtension = createExtension({
  key: 'typographyShortcuts',
  prosemirrorPlugins: [createArrowTypographyPlugin()],
})
