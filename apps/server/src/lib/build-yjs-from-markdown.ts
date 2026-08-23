import * as Y from 'yjs'
import {
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
  type PartialBlock,
} from '@blocknote/core'
import { blocksToYDoc } from '@blocknote/core/yjs'

const DOCUMENT_FRAGMENT = 'document-store'

const editorSchema = BlockNoteSchema.create({
  blockSpecs: defaultBlockSpecs,
})

let editor: BlockNoteEditor | null = null

function getEditor() {
  if (!editor) {
    editor = BlockNoteEditor.create({ schema: editorSchema })
  }
  return editor
}

function markdownToBlocks(markdown: string): PartialBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: PartialBlock[] = []

  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (!trimmed.trim()) continue

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 1
      blocks.push({
        type: 'heading',
        props: { level: Math.min(level, 3) },
        content: headingMatch[2] ?? '',
      })
      continue
    }

    const checkboxMatch = trimmed.match(/^-\s+\[( |x|X)\]\s+(.*)$/)
    if (checkboxMatch) {
      blocks.push({
        type: 'checkListItem',
        props: { checked: checkboxMatch[1]?.toLowerCase() === 'x' },
        content: checkboxMatch[2] ?? '',
      })
      continue
    }

    if (trimmed.startsWith('- ')) {
      blocks.push({
        type: 'bulletListItem',
        content: trimmed.slice(2),
      })
      continue
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({
        type: 'paragraph',
        content: trimmed.slice(2),
      })
      continue
    }

    blocks.push({
      type: 'paragraph',
      content: trimmed,
    })
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', content: '' })
  }

  return blocks
}

export function markdownToPlaintext(markdown: string) {
  return markdown
    .replace(/\[(.+?)\]\((?:note|task):[^)]+\)/g, '$1')
    .replace(/\[(.+?)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildYjsStateFromMarkdown(markdown: string, title?: string) {
  const blockEditor = getEditor()
  const doc = blocksToYDoc(blockEditor, markdownToBlocks(markdown), DOCUMENT_FRAGMENT)

  if (title?.trim()) {
    doc.getText('title').insert(0, title.trim())
  }

  return Buffer.from(Y.encodeStateAsUpdate(doc))
}

export function derivePageTitleFromMarkdown(markdown: string, fallback = 'Untitled') {
  const firstLine = markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) return fallback

  const heading = firstLine.match(/^#{1,3}\s+(.*)$/)
  if (heading?.[1]?.trim()) {
    return heading[1].trim().slice(0, 200)
  }

  return firstLine.replace(/\*\*(.+?)\*\*/g, '$1').slice(0, 200) || fallback
}
