import { useCallback, useEffect, useRef, useState } from 'react'
import type { NavDirection } from '@/features/database/lib/table-navigation'

type UseCellEditOptions = {
  onNavigate?: (direction: NavDirection) => void
}

export function useCellEdit<T>(
  value: T,
  onCommit: (value: T) => void,
  options: UseCellEditOptions = {},
) {
  const { onNavigate } = options
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const startEditing = useCallback(() => {
    setDraft(value)
    setEditing(true)
  }, [value])

  const commit = useCallback(() => {
    setEditing(false)
    if (draft !== value) {
      onCommit(draft)
    }
  }, [draft, onCommit, value])

  const cancel = useCallback(() => {
    setDraft(value)
    setEditing(false)
  }, [value])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        commit()
        onNavigate?.('down')
        return
      }
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault()
        commit()
        onNavigate?.('up')
        return
      }
      if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault()
        commit()
        onNavigate?.('next')
        return
      }
      if (event.key === 'Tab' && event.shiftKey) {
        event.preventDefault()
        commit()
        onNavigate?.('prev')
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        cancel()
      }
    },
    [cancel, commit, onNavigate],
  )

  return {
    editing,
    draft,
    setDraft,
    inputRef,
    startEditing,
    commit,
    cancel,
    handleKeyDown,
  }
}
