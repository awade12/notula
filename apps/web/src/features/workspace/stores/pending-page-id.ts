let pendingPageId: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export function setPendingPageId(pageId: string | null) {
  if (pendingPageId === pageId) return
  pendingPageId = pageId
  emit()
}

export function getPendingPageId() {
  return pendingPageId
}

export function subscribePendingPageId(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
