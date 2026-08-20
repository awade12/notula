import {
  isStyledTextInlineContent,
  type Block,
  type BlockNoteEditor,
  type BlockSchema,
  type InlineContentSchema,
  type PartialBlock,
  type StyleSchema,
} from '@blocknote/core'

function setSelectionToNextContentEditableBlock<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(editor: BlockNoteEditor<BSchema, I, S>) {
  let block = editor.getTextCursorPosition().block
  let contentType = editor.schema.blockSchema[block.type]?.content

  while (contentType === 'none') {
    const nextBlock = editor.getTextCursorPosition().nextBlock
    if (!nextBlock) {
      const lastBlock = editor.document.at(-1)
      if (!lastBlock) return

      const newBlock = editor.insertBlocks([{ type: 'paragraph' }], lastBlock, 'after')[0]
      if (!newBlock) return

      editor.setTextCursorPosition(newBlock, 'end')
      return
    }

    block = nextBlock
    contentType = editor.schema.blockSchema[block.type]?.content as 'inline' | 'table' | 'none'
    editor.setTextCursorPosition(block, 'end')
  }
}

export function insertOrUpdateBlockForSlashMenu<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(
  editor: BlockNoteEditor<BSchema, I, S>,
  block: PartialBlock<BSchema, I, S>,
): Block<BSchema, I, S> {
  const currentBlock = editor.getTextCursorPosition().block

  if (currentBlock.content === undefined) {
    throw new Error("Slash Menu open in a block that doesn't contain content.")
  }

  let newBlock: Block<BSchema, I, S>

  const firstContent = Array.isArray(currentBlock.content) ? currentBlock.content[0] : undefined
  const isSlashOnly =
    Array.isArray(currentBlock.content) &&
    currentBlock.content.length === 1 &&
    firstContent !== undefined &&
    isStyledTextInlineContent(firstContent) &&
    firstContent.type === 'text' &&
    firstContent.text === '/'

  if (isSlashOnly || (Array.isArray(currentBlock.content) && currentBlock.content.length === 0)) {
    newBlock = editor.updateBlock(currentBlock, block)
    editor.setTextCursorPosition(newBlock)
  } else {
    const inserted = editor.insertBlocks([block], currentBlock, 'after')[0]
    if (!inserted) {
      throw new Error('Failed to insert block from slash menu.')
    }
    newBlock = inserted
    const nextBlock = editor.getTextCursorPosition().nextBlock
    if (nextBlock) {
      editor.setTextCursorPosition(nextBlock)
    }
  }

  setSelectionToNextContentEditableBlock(editor)

  return newBlock
}
