import { useCallback, useEffect, useState } from 'react'

export function useExpandedNodes(activeIds: string[] = []) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (activeIds.length === 0) return

    setExpanded((current) => {
      const next = new Set(current)
      let changed = false

      for (const id of activeIds) {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [activeIds])

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded])

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expand = useCallback((id: string) => {
    setExpanded((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }, [])

  return { isExpanded, toggle, expand }
}
