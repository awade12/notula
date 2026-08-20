import * as Y from 'yjs'
import type { InsightInput } from '../../modules/insights/service'

const BLOCKNOTE_FRAGMENT = 'document-store'

function isNodeName(node: Y.XmlElement, name: string) {
  return node.nodeName.toLowerCase() === name.toLowerCase()
}

function attr(element: Y.XmlElement, name: string) {
  return element.getAttribute(name) ?? ''
}

function defaultStatusForKind(kind: InsightInput['kind']) {
  switch (kind) {
    case 'signal':
      return 'observed'
    case 'decision':
      return 'draft'
  }
}

function collectInlineText(node: unknown, parts: string[]) {
  if (node instanceof Y.Text) {
    const text = node.toString()
    if (text) parts.push(text)
    return
  }

  if (node instanceof Y.XmlElement || node instanceof Y.XmlFragment) {
    for (const child of node.toArray()) {
      collectInlineText(child, parts)
    }
  }
}

function visitKnowledgeBlocks(node: unknown, insights: InsightInput[]) {
  if (!(node instanceof Y.XmlElement || node instanceof Y.XmlFragment)) return

  if (node instanceof Y.XmlElement && isNodeName(node, 'blockcontainer')) {
    const blockId = node.getAttribute('id')
    if (!blockId) return

    for (const child of node.toArray()) {
      if (!(child instanceof Y.XmlElement) || !isNodeName(child, 'knowledge')) {
        continue
      }

      const kind = attr(child, 'kind')
      if (kind !== 'decision' && kind !== 'signal') {
        continue
      }

      const parts: string[] = []
      collectInlineText(child, parts)
      const status = attr(child, 'status')

      insights.push({
        id: blockId,
        kind,
        content: parts.join('').trim(),
        status: status || defaultStatusForKind(kind),
        owner: attr(child, 'owner'),
        source: attr(child, 'source'),
        supersedes: attr(child, 'supersedes'),
        dueDate: attr(child, 'dueDate'),
      })
    }
  }

  for (const child of node.toArray()) {
    visitKnowledgeBlocks(child, insights)
  }
}

export function extractInsights(state: Uint8Array): InsightInput[] {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, state)
  const insights: InsightInput[] = []
  visitKnowledgeBlocks(doc.getXmlFragment(BLOCKNOTE_FRAGMENT), insights)
  return insights
}
