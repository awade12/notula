import { useEffect, useRef } from 'react'
import { useCellEdit } from '@/features/database/hooks/use-cell-edit'
import {
  dbHeaderLabel,
  dbHeaderLabelButton,
  dbHeaderLabelEditing,
} from '@/features/database/lib/database-classes'
import { PropertyTypeIcon } from '@/features/database/lib/property-type-icon'
import type { PropertyDefinition } from '@notesapp/shared'

type TableHeaderLabelProps = {
  property: PropertyDefinition
  onRename: (propertyId: string, name: string) => void
  editable?: boolean
  autoFocusRename?: boolean
  onAutoFocusRenameDone?: () => void
}

export function TableHeaderLabel({
  property,
  onRename,
  editable = true,
  autoFocusRename = false,
  onAutoFocusRenameDone,
}: TableHeaderLabelProps) {
  const didAutoFocus = useRef(false)
  const { editing, draft, setDraft, inputRef, startEditing, commit, cancel } = useCellEdit(
    property.name,
    (name) => onRename(property.id, name.trim() || property.name),
  )

  useEffect(() => {
    if (!autoFocusRename || !editable || didAutoFocus.current) return
    didAutoFocus.current = true
    startEditing()
    onAutoFocusRenameDone?.()
  }, [autoFocusRename, editable, onAutoFocusRenameDone, startEditing])

  if (!editable) {
    return (
      <div className={dbHeaderLabel}>
        <PropertyTypeIcon type={property.type} />
        <span className="truncate">{property.name}</span>
      </div>
    )
  }

  if (editing) {
    return (
      <div className={dbHeaderLabelEditing}>
        <PropertyTypeIcon type={property.type} />
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              cancel()
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-xs font-medium text-text-emphasis outline-none"
          aria-label={`Rename ${property.name}`}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={dbHeaderLabelButton}
      title="Click to rename"
    >
      <PropertyTypeIcon type={property.type} />
      <span className="truncate">{property.name}</span>
    </button>
  )
}
