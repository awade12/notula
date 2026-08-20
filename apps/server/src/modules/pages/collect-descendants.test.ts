import { describe, expect, test } from 'bun:test'
import { collectDescendantIds } from './collect-descendants'

describe('collectDescendantIds', () => {
  test('returns root and all nested children', () => {
    const pages = [
      { id: 'root', parentId: null },
      { id: 'a', parentId: 'root' },
      { id: 'b', parentId: 'a' },
      { id: 'other', parentId: null },
    ]

    expect(collectDescendantIds(pages, 'root').sort()).toEqual(['a', 'b', 'root'])
  })

  test('returns only the page when it has no children', () => {
    const pages = [
      { id: 'solo', parentId: null },
      { id: 'other', parentId: null },
    ]

    expect(collectDescendantIds(pages, 'solo')).toEqual(['solo'])
  })
})
