import { BlockNoteEditor } from '@blocknote/core'
import type { PartialBlock } from '@blocknote/core'
import { notesBlockSchema } from '@/features/editor/lib/block-schema'
import { normalizeTaskAiMarkdown } from './normalize-task-ai-markdown'

let markdownParser: BlockNoteEditor<
  typeof notesBlockSchema.blockSchema,
  typeof notesBlockSchema.inlineContentSchema,
  typeof notesBlockSchema.styleSchema
> | null = null

function getMarkdownParser() {
  if (!markdownParser) {
    markdownParser = BlockNoteEditor.create({ schema: notesBlockSchema })
  }
  return markdownParser
}

function readBlockPlainText(block: PartialBlock) {
  if (typeof block.content === 'string') return block.content
  if (!Array.isArray(block.content)) return ''

  return block.content
    .map((item) => {
      if (typeof item !== 'object' || item === null) return ''
      return 'text' in item && typeof item.text === 'string' ? item.text : ''
    })
    .join('')
}

function isHashOnlyParagraph(block: PartialBlock | undefined) {
  if (!block || block.type !== 'paragraph') return false
  return /^#{1,6}$/.test(readBlockPlainText(block).trim())
}

function repairParsedDescriptionBlocks(blocks: PartialBlock[]) {
  const result: PartialBlock[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (!block) continue
    const next = blocks[i + 1]

    if (isHashOnlyParagraph(block)) {
      const marker = readBlockPlainText(block).trim()
      const level = Math.min(marker.length, 6)

      if (next?.type === 'heading') {
        result.push(next)
        i++
        continue
      }

      if (next?.type === 'paragraph') {
        const title = readBlockPlainText(next).trim()
        if (title && !/^#{1,6}\s/.test(title)) {
          result.push({
            type: 'heading',
            props: { level },
            content: [{ type: 'text', text: title, styles: {} }],
          })
          i++
          continue
        }
      }

      continue
    }

    result.push(block)
  }

  return result.length > 0 ? result : blocks
}

export function markdownToTaskDescriptionBlocks(markdown: string): PartialBlock[] {
  const normalized = normalizeTaskAiMarkdown(markdown)
  if (!normalized) {
    return [{ type: 'paragraph', content: '' }]
  }

  const parsed = getMarkdownParser().tryParseMarkdownToBlocks(normalized) as PartialBlock[]
  return repairParsedDescriptionBlocks(parsed)
}
