import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { dbCellDisplay, dbCellEditing } from '@/features/database/lib/database-classes'
import { useCellEdit } from '@/features/database/hooks/use-cell-edit'

type TextCellProps = {
  rowId: string
  propertyId: string
  value: unknown
  onCommit: (value: unknown) => void
  primary?: boolean
  autoFocus?: boolean
  onNavigate?: (direction: import('@/features/database/lib/table-navigation').NavDirection) => void
  readOnly?: boolean
}

export function TextCell({
  value,
  onCommit,
  primary = false,
  autoFocus = false,
  onNavigate,
  readOnly = false,
}: TextCellProps) {
  const stringValue = typeof value === 'string' ? value : ''
  const { editing, draft, setDraft, inputRef, startEditing, commit, handleKeyDown } = useCellEdit(
    stringValue,
    (next) => onCommit(next),
    { onNavigate },
  )

  useEffect(() => {
    if (autoFocus) startEditing()
  }, [autoFocus, startEditing])

  const isEmpty = !stringValue.trim()
  const displayEmpty = primary ? 'Untitled' : 'Empty'

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          dbCellEditing,
          'min-w-0 w-full bg-transparent outline-none',
          primary ? 'text-sm font-medium text-text-emphasis' : 'text-sm text-text-emphasis',
        )}
        placeholder={displayEmpty}
      />
    )
  }

  return (
    readOnly ? (
      <div
        className={cn(
          dbCellDisplay,
          'min-w-0 w-full text-left',
          primary
            ? cn('text-sm font-medium', isEmpty ? 'text-text-primary/30' : 'text-text-emphasis')
            : cn('text-sm', isEmpty ? 'text-text-primary/30' : 'text-text-primary/85'),
        )}
      >
        <span className="block truncate">{isEmpty ? displayEmpty : stringValue}</span>
      </div>
    ) : (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        dbCellDisplay,
        'min-w-0 w-full text-left outline-none',
        primary
          ? cn('text-sm font-medium', isEmpty ? 'text-text-primary/30' : 'text-text-emphasis')
          : cn('text-sm', isEmpty ? 'text-text-primary/30' : 'text-text-primary/85'),
      )}
    >
      <span className="block truncate">{isEmpty ? displayEmpty : stringValue}</span>
    </button>
    )
  )
}
