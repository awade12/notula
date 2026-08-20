export type DropPlacement = 'before' | 'after' | 'inside'

export type ActiveDropTarget = {
  targetId: string
  placement: DropPlacement
  invalid?: boolean
}

const FOLDER_EDGE_RATIO = 0.28

export function resolveDropPlacement(
  clientY: number,
  rowTop: number,
  rowHeight: number,
  options?: { allowInside?: boolean },
): DropPlacement {
  const offset = clientY - rowTop
  const ratio = rowHeight > 0 ? offset / rowHeight : 0.5

  if (options?.allowInside) {
    if (ratio < FOLDER_EDGE_RATIO) return 'before'
    if (ratio > 1 - FOLDER_EDGE_RATIO) return 'after'
    return 'inside'
  }

  if (ratio < 0.5) return 'before'
  return 'after'
}

export function resolveDropPlacementWithHysteresis(
  clientY: number,
  rowTop: number,
  rowHeight: number,
  previous: DropPlacement | null,
  options?: { allowInside?: boolean },
): DropPlacement {
  const next = resolveDropPlacement(clientY, rowTop, rowHeight, options)
  if (!previous || previous === next) return next

  const offset = clientY - rowTop
  const ratio = rowHeight > 0 ? offset / rowHeight : 0.5

  if (options?.allowInside) {
    const beforeEdge = FOLDER_EDGE_RATIO + 0.04
    const afterEdge = 1 - FOLDER_EDGE_RATIO - 0.04
    const insideStart = FOLDER_EDGE_RATIO + 0.02
    const insideEnd = 1 - FOLDER_EDGE_RATIO - 0.02

    if (previous === 'before' && ratio < beforeEdge) return 'before'
    if (previous === 'after' && ratio > afterEdge) return 'after'
    if (previous === 'inside' && ratio > insideStart && ratio < insideEnd) return 'inside'
  } else {
    if (previous === 'before' && ratio < 0.55) return 'before'
    if (previous === 'after' && ratio > 0.45) return 'after'
  }

  return next
}
