import { generateKeyBetween } from 'fractional-indexing'
import type { FlatPage, PageTreeNode } from './build-tree'
import type { DropPlacement } from './drop-target'
import { isFolderKind } from '../types/page-kind'

export function isDescendantOf(
  flat: FlatPage[],
  ancestorId: string,
  nodeId: string,
): boolean {
  let current = flat.find((page) => page.id === nodeId)

  while (current?.parentId) {
    if (current.parentId === ancestorId) return true
    current = flat.find((page) => page.id === current?.parentId)
  }

  return false
}

export function canMovePage(
  flat: FlatPage[],
  draggedId: string,
  target: PageTreeNode,
  placement: DropPlacement,
): boolean {
  if (draggedId === target.id) return false
  if (isDescendantOf(flat, draggedId, target.id)) return false

  if (placement === 'inside') {
    return isFolderKind(target.kind)
  }

  return true
}

function computeMovePosition(
  flat: FlatPage[],
  draggedId: string,
  target: PageTreeNode,
  placement: DropPlacement,
): { parentId: string | null; position: string } | null {
  const dragged = flat.find((page) => page.id === draggedId)
  if (!dragged) return null

  const others = flat.filter((page) => page.id !== draggedId)

  if (placement === 'inside') {
    const siblings = others
      .filter((page) => page.parentId === target.id)
      .sort((a, b) => a.position.localeCompare(b.position))

    return {
      parentId: target.id,
      position: generateKeyBetween(siblings.at(-1)?.position ?? null, null),
    }
  }

  const parentId = target.parentId
  const siblings = others
    .filter((page) => page.parentId === parentId)
    .sort((a, b) => a.position.localeCompare(b.position))

  if (placement === 'before') {
    const index = siblings.findIndex((page) => page.id === target.id)
    if (index === -1) return null

    const previous = index > 0 ? (siblings[index - 1]?.position ?? null) : null
    const next = siblings[index]?.position ?? null
    return { parentId, position: generateKeyBetween(previous, next) }
  }

  const index = siblings.findIndex((page) => page.id === target.id)
  if (index === -1) return null

  const previous = siblings[index]?.position ?? null
  const next = index < siblings.length - 1 ? (siblings[index + 1]?.position ?? null) : null
  return { parentId, position: generateKeyBetween(previous, next) }
}

export function applyMoveToFlatPages(
  flat: FlatPage[],
  draggedId: string,
  target: PageTreeNode,
  placement: DropPlacement,
): FlatPage[] | null {
  if (!canMovePage(flat, draggedId, target, placement)) return null

  const next = computeMovePosition(flat, draggedId, target, placement)
  if (!next) return null

  return flat.map((page) =>
    page.id === draggedId
      ? { ...page, parentId: next.parentId, position: next.position }
      : page,
  )
}
