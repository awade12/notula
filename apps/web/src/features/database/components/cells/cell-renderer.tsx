import type { FlatPage } from '@/features/workspace/lib/build-tree'
import type { PropertyDefinition } from '@notesapp/shared'
import type { NavDirection } from '@/features/database/lib/table-navigation'
import { CheckboxCell } from './checkbox-cell'
import { NumberCell } from './number-cell'
import { MultiSelectCell } from './multi-select-cell'
import { RelationCell } from './relation-cell'
import { SelectCell } from './select-cell'
import { TextCell } from './text-cell'

type CellRendererProps = {
  rowId: string
  property: PropertyDefinition
  value: unknown
  onCommit: (value: unknown) => void
  pages?: FlatPage[]
  autoFocus?: boolean
  onNavigate?: (direction: NavDirection) => void
  readOnly?: boolean
}

export function CellRenderer({
  rowId,
  property,
  value,
  onCommit,
  pages = [],
  autoFocus,
  onNavigate,
  readOnly = false,
}: CellRendererProps) {
  switch (property.type) {
    case 'text':
      return (
        <TextCell
          rowId={rowId}
          propertyId={property.id}
          value={value}
          onCommit={onCommit}
          primary={property.id === 'title'}
          autoFocus={autoFocus}
          onNavigate={onNavigate}
          readOnly={readOnly}
        />
      )
    case 'number':
      return (
        <NumberCell
          rowId={rowId}
          propertyId={property.id}
          value={value}
          onCommit={onCommit}
          autoFocus={autoFocus}
          onNavigate={onNavigate}
          readOnly={readOnly}
        />
      )
    case 'checkbox':
      return (
        <CheckboxCell
          rowId={rowId}
          propertyId={property.id}
          value={value}
          onCommit={onCommit}
          readOnly={readOnly}
        />
      )
    case 'select':
      return (
        <SelectCell
          rowId={rowId}
          propertyId={property.id}
          property={property}
          value={value}
          onCommit={onCommit}
          readOnly={readOnly}
        />
      )
    case 'multi_select':
      return <MultiSelectCell property={property} value={value} readOnly={readOnly} />
    case 'relation':
      return (
        <RelationCell
          rowId={rowId}
          propertyId={property.id}
          property={property}
          value={value}
          pages={pages}
          onCommit={onCommit}
          readOnly={readOnly}
        />
      )
    default:
      return (
        <div className="flex min-h-8 items-center px-2.5 text-xs text-text-primary/35">
          Unsupported type
        </div>
      )
  }
}
