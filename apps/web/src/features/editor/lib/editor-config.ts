import { en } from '@blocknote/core/locales'

export const editorDictionary = {
  ...en,
  placeholders: {
    ...en.placeholders,
    default: "Type '/' for blocks · '@' to link pages",
    emptyDocument: "Type '/' for blocks · '@' to link pages",
  },
}

export const editorDomAttributes = {
  editor: {
    class: 'notes-editor-content',
    spellcheck: 'true',
  },
}
