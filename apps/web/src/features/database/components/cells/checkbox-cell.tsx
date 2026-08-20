import { dbCell } from '@/features/database/lib/database-classes'
import { cn } from '@/lib/cn'

type CheckboxCellProps = {
  rowId: string
  propertyId: string
  value: unknown
  onCommit: (value: unknown) => void
  readOnly?: boolean
}

export function CheckboxCell({ value, onCommit, readOnly = false }: CheckboxCellProps) {
  const checked = value === true

  return (
    <div className={cn(dbCell, 'justify-center')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={readOnly}
        onClick={() => onCommit(!checked)}
        className={cn(
          'flex size-4 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-transparent bg-text-emphasis/90 text-background'
            : 'border-border/80 bg-transparent hover:border-white/25',
        )}
      >
        {checked ? <span className="text-[10px] leading-none">✓</span> : null}
      </button>
    </div>
  )
}
