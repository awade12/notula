import { describe, expect, test } from 'bun:test'
import * as Y from 'yjs'
import { extractInsights } from './extract-insights'

function buildKnowledgeDoc(
  blocks: Array<{
    id: string
    kind: string
    status: string
    content: string
    owner?: string
    source?: string
    supersedes?: string
  }>,
) {
  const doc = new Y.Doc()
  const fragment = doc.getXmlFragment('document-store')
  const elements: Y.XmlElement[] = []

  for (const block of blocks) {
    const container = new Y.XmlElement('blockContainer')
    container.setAttribute('id', block.id)
    const knowledge = new Y.XmlElement('knowledge')
    knowledge.setAttribute('kind', block.kind)
    knowledge.setAttribute('status', block.status)
    if (block.owner) knowledge.setAttribute('owner', block.owner)
    if (block.source) knowledge.setAttribute('source', block.source)
    if (block.supersedes) knowledge.setAttribute('supersedes', block.supersedes)
    if (block.content) knowledge.insert(0, [new Y.Text(block.content)])
    container.insert(0, [knowledge])
    elements.push(container)
  }

  fragment.insert(0, elements)
  return Y.encodeStateAsUpdate(doc)
}

describe('extractInsights', () => {
  test('extracts knowledge blocks from yjs state', () => {
    const state = buildKnowledgeDoc([
      {
        id: 'block-1',
        kind: 'decision',
        status: 'draft',
        content: 'Ship the dashboard by Friday',
      },
      {
        id: 'block-2',
        kind: 'signal',
        status: 'observed',
        content: 'Users asked for dark mode',
        source: 'Support tickets',
      },
    ])

    const insights = extractInsights(state)
    expect(insights).toHaveLength(2)
    expect(insights[0]).toMatchObject({
      id: 'block-1',
      kind: 'decision',
      status: 'draft',
      content: 'Ship the dashboard by Friday',
    })
    expect(insights[1]).toMatchObject({
      id: 'block-2',
      kind: 'signal',
      status: 'observed',
      content: 'Users asked for dark mode',
      source: 'Support tickets',
    })
  })

  test('extracts knowledge blocks from real blocknote yjs structure', () => {
    const doc = new Y.Doc()
    const knowledge = new Y.XmlElement('knowledge')
    knowledge.setAttribute('kind', 'decision')
    knowledge.setAttribute('status', 'accepted')
    knowledge.insert(0, [new Y.Text('Use Postgres for search')])

    const container = new Y.XmlElement('blockContainer')
    container.setAttribute('id', 'block-real')
    container.insert(0, [knowledge])

    const blockGroup = new Y.XmlElement('blockGroup')
    blockGroup.insert(0, [container])
    doc.getXmlFragment('document-store').insert(0, [blockGroup])

    const insights = extractInsights(Y.encodeStateAsUpdate(doc))
    expect(insights).toHaveLength(1)
    expect(insights[0]).toMatchObject({
      id: 'block-real',
      kind: 'decision',
      status: 'accepted',
      content: 'Use Postgres for search',
    })
  })

  test('returns empty array when no knowledge blocks exist', () => {
    const doc = new Y.Doc()
    const fragment = doc.getXmlFragment('document-store')
    const paragraph = new Y.XmlElement('paragraph')
    paragraph.insert(0, [new Y.Text('Hello')])
    fragment.insert(0, [paragraph])
    expect(extractInsights(Y.encodeStateAsUpdate(doc))).toEqual([])
  })

  test('ignores legacy loop kinds', () => {
    const state = buildKnowledgeDoc([
      {
        id: 'block-legacy',
        kind: 'commitment',
        status: 'open',
        content: 'Old commitment block',
      },
    ])

    expect(extractInsights(state)).toEqual([])
  })
})
