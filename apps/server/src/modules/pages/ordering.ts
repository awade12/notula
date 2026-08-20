import { generateKeyBetween } from 'fractional-indexing'

export function initialPagePosition(existingPositions: string[]) {
  const last = existingPositions.at(-1) ?? null
  return generateKeyBetween(last, null)
}

export function positionAfter(existingPositions: string[]) {
  const last = existingPositions.at(-1) ?? null
  return generateKeyBetween(last, null)
}

export function positionBefore(firstPosition: string | null) {
  return generateKeyBetween(null, firstPosition)
}

export function positionBetween(before: string | null, after: string | null) {
  return generateKeyBetween(before, after)
}
