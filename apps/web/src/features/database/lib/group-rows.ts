import type { PropertyDefinition } from '@notesapp/shared'
import type { DatabaseRow } from '../types'

export type BoardGroup = {
  id: string | null
  label: string
  color?: string
  rows: DatabaseRow[]
}

type GroupRowsOptions = {
  includeEmptyGroup?: boolean
}

export function groupRowsBySelect(
  rows: DatabaseRow[],
  groupProperty: PropertyDefinition,
  options: GroupRowsOptions = {},
): BoardGroup[] {
  const includeEmptyGroup = options.includeEmptyGroup !== false
  const selectOptions = groupProperty.config?.options ?? []
  const optionGroups: BoardGroup[] = selectOptions.map((option) => ({
    id: option.id,
    label: option.label,
    color: option.color,
    rows: [] as DatabaseRow[],
  }))

  const groups: BoardGroup[] = includeEmptyGroup
    ? [{ id: null, label: 'No value', rows: [] }, ...optionGroups]
    : optionGroups

  const fallbackGroup = includeEmptyGroup ? groups[0] : optionGroups[0]

  for (const row of rows) {
    const value = row.properties[groupProperty.id]
    const group =
      typeof value === 'string'
        ? groups.find((item) => item.id === value)
        : fallbackGroup
    ;(group ?? fallbackGroup)?.rows.push(row)
  }

  return groups
}
