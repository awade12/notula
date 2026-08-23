import { describe, expect, test } from 'bun:test'
import { positionAfter, positionBetween } from '../pages/ordering'

function computeRowPosition(
  siblings: { id: string; position: string }[],
  rowId: string,
  input: { beforeId?: string | null; afterId?: string | null },
) {
  const others = siblings.filter((row) => row.id !== rowId)

  if (input.beforeId) {
    const beforeIndex = others.findIndex((row) => row.id === input.beforeId)
    if (beforeIndex === -1) throw new Error('Invalid beforeId')
    const beforePos = others[beforeIndex]?.position ?? null
    const prevPos = beforeIndex > 0 ? (others[beforeIndex - 1]?.position ?? null) : null
    return positionBetween(prevPos, beforePos)
  }

  if (input.afterId) {
    const afterIndex = others.findIndex((row) => row.id === input.afterId)
    if (afterIndex === -1) throw new Error('Invalid afterId')
    const afterPos = others[afterIndex]?.position ?? null
    const nextPos =
      afterIndex < others.length - 1 ? (others[afterIndex + 1]?.position ?? null) : null
    return positionBetween(afterPos, nextPos)
  }

  return positionAfter(others.map((row) => row.position))
}

describe('computeRowPosition', () => {
  const siblings = [
    { id: 'a', position: 'a0' },
    { id: 'b', position: 'a1' },
    { id: 'c', position: 'a2' },
  ]

  test('inserts after a sibling', () => {
    const position = computeRowPosition(siblings, 'moving', { afterId: 'a' })
    expect(position > 'a0').toBe(true)
    expect(position < 'a1').toBe(true)
  })

  test('inserts before a sibling', () => {
    const position = computeRowPosition(siblings, 'moving', { beforeId: 'c' })
    expect(position > 'a1').toBe(true)
    expect(position < 'a2').toBe(true)
  })

  test('appends when no anchor is provided', () => {
    const position = computeRowPosition(siblings, 'moving', {})
    expect(position > 'a2').toBe(true)
  })
})
