import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { dbCellDisplay, dbCellEditing } from '@/features/database/lib/database-classes'
import { useCellEdit } from '@/features/database/hooks/use-cell-edit'

type NumberCellProps = {
  rowId: string
  propertyId: string
  value: unknown
  onCommit: (value: unknown) => void
  autoFocus?: boolean
  onNavigate?: (direction: import('@/features/database/lib/table-navigation').NavDirection) => void
  readOnly?: boolean
}

function formatDisplay(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

function parseDraft(draft: string) {
  const trimmed = draft.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function NumberCell({
  value,
  onCommit,
  autoFocus = false,
  onNavigate,
  readOnly = false,
}: NumberCellProps) {
  const display = formatDisplay(value)
  const { editing, draft, setDraft, inputRef, startEditing, commit, handleKeyDown } = useCellEdit(
    display,
    (next) => {
      const parsed = parseDraft(next)
      if (parsed !== value) onCommit(parsed)
    },
    { onNavigate },
  )

  useEffect(() => {
    if (autoFocus) startEditing()
  }, [autoFocus, startEditing])

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          dbCellEditing,
          'min-w-0 w-full bg-transparent text-sm tabular-nums text-text-emphasis outline-none',
        )}
        placeholder="Empty"
      />
    )
  }

  return readOnly ? (
    <div
      className={cn(
        dbCellDisplay,
        'min-w-0 w-full text-left text-sm tabular-nums',
        display ? 'text-text-primary/85' : 'text-text-primary/30',
      )}
    >
      <span className="block truncate">{display || 'Empty'}</span>
    </div>
  ) : (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        dbCellDisplay,
        'min-w-0 w-full text-left text-sm tabular-nums outline-none',
        display ? 'text-text-primary/85' : 'text-text-primary/30',
      )}
    >
      <span className="block truncate">{display || 'Empty'}</span>
    </button>
  )
}
