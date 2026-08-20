type InlineNode = { type?: string; text?: string }
type BlockNode = { type?: string; content?: string | InlineNode[] }

export function extractCommentPlaintext(body: unknown): string {
  if (!Array.isArray(body)) return ''

  return body
    .map((block) => {
      if (!block || typeof block !== 'object') return ''
      const node = block as BlockNode

      if (typeof node.content === 'string') return node.content
      if (!Array.isArray(node.content)) return ''

      return node.content
        .map((inline) => {
          if (typeof inline === 'string') return inline
          if (inline && typeof inline === 'object' && typeof inline.text === 'string') {
            return inline.text
          }
          return ''
        })
        .join('')
    })
    .filter((line) => line.length > 0)
    .join('\n')
}
