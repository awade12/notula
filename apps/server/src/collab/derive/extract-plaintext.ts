import * as Y from 'yjs'

const BLOCKNOTE_FRAGMENT = 'document-store'
const PAGE_TITLE_YKEY = 'title'

function collectText(node: unknown, parts: string[]) {
  if (node instanceof Y.Text) {
    const text = node.toString().trim()
    if (text) parts.push(text)
    return
  }

  if (node instanceof Y.XmlElement || node instanceof Y.XmlFragment) {
    for (const child of node.toArray()) {
      collectText(child, parts)
    }
  }
}

export function extractPlaintext(state: Uint8Array): string {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, state)
  const parts: string[] = []
  collectText(doc.getXmlFragment(BLOCKNOTE_FRAGMENT), parts)
  return parts.join('\n').trim()
}

export function extractTitle(state: Uint8Array): string {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, state)

  const yTitle = doc.getText(PAGE_TITLE_YKEY).toString().trim()
  if (yTitle) {
    return yTitle.length > 200 ? `${yTitle.slice(0, 197)}...` : yTitle
  }

  const plaintext = extractPlaintext(state)
  if (!plaintext) return 'Untitled'
  const firstLine = plaintext.split('\n')[0]?.trim()
  if (!firstLine) return 'Untitled'
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine
}

export function extractLinks(state: Uint8Array): string[] {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, state)
  const pageIds: string[] = []
  collectPageMentions(doc.getXmlFragment(BLOCKNOTE_FRAGMENT), pageIds)
  return [...new Set(pageIds)]
}

function collectPageMentions(node: unknown, pageIds: string[]) {
  if (node instanceof Y.XmlElement) {
    if (node.getAttribute('data-inline-content-type') === 'pageMention') {
      const pageId = node.getAttribute('data-page-id')
      if (pageId) pageIds.push(pageId)
    }

    for (const child of node.toArray()) {
      collectPageMentions(child, pageIds)
    }
    return
  }

  if (node instanceof Y.XmlFragment) {
    for (const child of node.toArray()) {
      collectPageMentions(child, pageIds)
    }
  }
}
