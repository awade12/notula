import type { FlatPage, PageTreeNode } from './build-tree'
import type { DropPlacement } from './drop-target'
import { isFolderKind } from '../types/page-kind'
import { canMovePage } from './page-tree-move'

export type MovePageInput = {
  pageId: string
  parentId?: string | null
  beforeId?: string | null
  afterId?: string | null
}

export function buildMovePayload(
  flat: FlatPage[],
  draggedId: string,
  target: PageTreeNode,
  placement: DropPlacement,
): MovePageInput | null {
  if (!canMovePage(flat, draggedId, target, placement)) return null

  if (placement === 'inside') {
    if (!isFolderKind(target.kind)) return null
    return { pageId: draggedId, parentId: target.id }
  }

  if (placement === 'before') {
    return { pageId: draggedId, parentId: target.parentId, beforeId: target.id }
  }

  return { pageId: draggedId, parentId: target.parentId, afterId: target.id }
}
