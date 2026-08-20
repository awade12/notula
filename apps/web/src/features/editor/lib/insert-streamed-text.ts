import type { NotesEditor } from '@/features/editor/lib/block-schema'

function normalizeAiMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\\+\s*$/, ''))
    .join('\n')
    .trim()
}

function isEmptyParagraphBlock(editor: NotesEditor, blockId: string): boolean {
  const block = editor.getBlock(blockId)
  if (!block || block.type !== 'paragraph') return false
  if (!Array.isArray(block.content) || block.content.length === 0) return true

  const first = block.content[0]
  return first?.type === 'text' && first.text.trim() === ''
}

export function insertMarkdownAtCursor(editor: NotesEditor, markdown: string) {
  const normalized = normalizeAiMarkdown(markdown)
  if (!normalized) return

  editor.focus()

  if (editor.isEmpty) {
    const blocks = editor.tryParseMarkdownToBlocks(normalized)
    editor.replaceBlocks(editor.document, blocks)
    const lastBlock = editor.document.at(-1)
    if (lastBlock) {
      editor.setTextCursorPosition(lastBlock, 'end')
    }
    return
  }

  const cursorBlock = editor.getTextCursorPosition().block

  if (isEmptyParagraphBlock(editor, cursorBlock.id)) {
    const blocks = editor.tryParseMarkdownToBlocks(normalized)
    const { insertedBlocks } = editor.replaceBlocks([cursorBlock.id], blocks)
    const lastBlock = insertedBlocks.at(-1)
    if (lastBlock) {
      editor.setTextCursorPosition(lastBlock, 'end')
    }
    return
  }

  editor.pasteMarkdown(normalized)
}

export function replaceSelectionWithMarkdown(editor: NotesEditor, markdown: string) {
  const normalized = normalizeAiMarkdown(markdown)
  if (!normalized) return

  editor.focus()
  const selection = editor.getSelection()

  if (selection && selection.blocks.length > 0) {
    const blocks = editor.tryParseMarkdownToBlocks(normalized)
    const { insertedBlocks } = editor.replaceBlocks(
      selection.blocks.map((block) => block.id),
      blocks,
    )
    const lastBlock = insertedBlocks.at(-1)
    if (lastBlock) {
      editor.setTextCursorPosition(lastBlock, 'end')
    }
    return
  }

  insertMarkdownAtCursor(editor, normalized)
}

export function insertTextAtCursor(editor: NotesEditor, text: string) {
  insertMarkdownAtCursor(editor, text)
}

export function appendStreamChunkToEditor(editor: NotesEditor, blockId: string, chunk: string) {
  const block = editor.getBlock(blockId)
  if (!block || block.type !== 'paragraph') return

  const current =
    Array.isArray(block.content) &&
    block.content.length === 1 &&
    block.content[0]?.type === 'text'
      ? block.content[0].text
      : ''

  editor.updateBlock(block, {
    type: 'paragraph',
    content: current + chunk,
  })
}

export function createStreamingParagraph(editor: NotesEditor) {
  const cursorBlock = editor.getTextCursorPosition().block
  const [block] = editor.insertBlocks([{ type: 'paragraph', content: '' }], cursorBlock, 'after')
  if (!block) throw new Error('Could not create streaming block')
  editor.setTextCursorPosition(block, 'end')
  return block.id
}
