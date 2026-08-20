import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  type BlockNoteEditor,
} from '@blocknote/core'
import { calloutBlockSpec } from '../components/blocks/callout-block'
import { embedBlockSpec } from '../components/blocks/embed-block'
import { toggleBlockSpec } from '../components/blocks/toggle-block'
import { databaseViewBlockSpec } from '../components/blocks/database-view-block'
import { knowledgeBlockSpec } from '../components/blocks/knowledge-block'
import { pageMentionSpec } from '../components/mentions/page-mention-spec'

export const notesBlockSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    callout: calloutBlockSpec(),
    embed: embedBlockSpec(),
    toggle: toggleBlockSpec(),
    knowledge: knowledgeBlockSpec(),
    databaseView: databaseViewBlockSpec(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    pageMention: pageMentionSpec,
  },
})

export type NotesEditor = BlockNoteEditor<
  typeof notesBlockSchema.blockSchema,
  typeof notesBlockSchema.inlineContentSchema,
  typeof notesBlockSchema.styleSchema
>
