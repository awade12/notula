import type { PartialBlock } from '@blocknote/core'

function isBlockArray(value: unknown): value is PartialBlock[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null)
}

export function parseProjectTaskDescription(value: unknown): PartialBlock[] | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined

  if (value.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (isBlockArray(parsed)) return parsed
    } catch {
      // fall through to plain text
    }
  }

  return [
    {
      type: 'paragraph',
      content: value,
    },
  ]
}

export function serializeProjectTaskDescription(blocks: unknown) {
  if (!Array.isArray(blocks) || blocks.length === 0) return ''
  if (blocks.length === 1 && typeof blocks[0] === 'object' && blocks[0] !== null) {
    const block = blocks[0] as { type?: string; content?: unknown }
    if (block.type === 'paragraph') {
      const content = block.content
      if (typeof content === 'string' && !content.trim()) return ''
    }
  }
  return JSON.stringify(blocks)
}

function readInlineText(content: unknown) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((item) => {
      if (typeof item !== 'object' || item === null) return ''
      if ('text' in item && typeof item.text === 'string') return item.text
      return ''
    })
    .join('')
}

function readBlockText(block: PartialBlock): string {
  const ownText = readInlineText(block.content)
  const childText = block.children?.map(readBlockText).filter(Boolean).join('\n') ?? ''
  return [ownText, childText].filter(Boolean).join('\n')
}

export function projectTaskDescriptionToPlainText(value: unknown) {
  const blocks = parseProjectTaskDescription(value)
  if (!blocks?.length) {
    return typeof value === 'string' && !value.startsWith('[') ? value.trim() : ''
  }
  return blocks.map(readBlockText).filter(Boolean).join('\n\n').trim()
}
