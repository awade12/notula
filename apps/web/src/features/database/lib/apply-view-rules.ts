import { findProperty, type DatabaseSchema, type FilterRule, type SortRule } from '@notesapp/shared'
import type { DatabaseRow } from '../types'

function isEmptyValue(value: unknown) {
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function matchesFilter(
  row: DatabaseRow,
  schema: DatabaseSchema,
  rule: FilterRule,
): boolean {
  const property = findProperty(schema.properties, rule.propertyId)
  if (!property) return true

  const value = row.properties[rule.propertyId]

  switch (rule.operator) {
    case 'is_empty':
      return isEmptyValue(value)
    case 'is_not_empty':
      return !isEmptyValue(value)
    case 'contains':
      return typeof value === 'string' && value.toLowerCase().includes(String(rule.value ?? '').toLowerCase())
    case 'is':
      return value === rule.value
    case 'is_not':
      return value !== rule.value
    default:
      return true
  }
}

export function applyFilters(
  rows: DatabaseRow[],
  schema: DatabaseSchema,
  filters: FilterRule[] | undefined,
) {
  if (!filters?.length) return rows
  return rows.filter((row) => filters.every((rule) => matchesFilter(row, schema, rule)))
}

function compareValues(a: unknown, b: unknown) {
  if (a === b) return 0
  if (isEmptyValue(a)) return 1
  if (isEmptyValue(b)) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b)
  }
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
}

export function applySorts(
  rows: DatabaseRow[],
  schema: DatabaseSchema,
  sorts: SortRule[] | undefined,
) {
  if (!sorts?.length) return rows

  return [...rows].sort((left, right) => {
    for (const rule of sorts) {
      if (!findProperty(schema.properties, rule.propertyId)) continue
      const result = compareValues(
        left.properties[rule.propertyId],
        right.properties[rule.propertyId],
      )
      if (result !== 0) {
        return rule.direction === 'asc' ? result : -result
      }
    }
    return left.position.localeCompare(right.position)
  })
}

export function applyViewRules(
  rows: DatabaseRow[],
  schema: DatabaseSchema,
  filters: FilterRule[] | undefined,
  sorts: SortRule[] | undefined,
) {
  return applySorts(applyFilters(rows, schema, filters), schema, sorts)
}
