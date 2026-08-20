import type { FilterRule, SortRule } from '@notesapp/shared'
import { sql, type SQL } from 'drizzle-orm'

function propertyExpr(propertyId: string) {
  return sql`properties->>${propertyId}`
}

export function buildPropertyFilter(rule: FilterRule): SQL {
  const path = propertyExpr(rule.propertyId)

  switch (rule.operator) {
    case 'is_empty':
      return sql`(${path} IS NULL OR ${path} = '' OR ${path} = 'null')`
    case 'is_not_empty':
      return sql`(${path} IS NOT NULL AND ${path} <> '' AND ${path} <> 'null')`
    case 'contains':
      return sql`${path} ILIKE ${`%${String(rule.value ?? '')}%`}`
    case 'is':
      return sql`${path} = ${String(rule.value ?? '')}`
    case 'is_not':
      return sql`(${path} IS NULL OR ${path} <> ${String(rule.value ?? '')})`
    default:
      return sql`true`
  }
}

export function combineFilters(filters: FilterRule[] | undefined): SQL | undefined {
  if (!filters?.length) return undefined
  const parts = filters.map(buildPropertyFilter)
  return sql.join(parts, sql` AND `)
}

export function buildSortClause(sorts: SortRule[] | undefined): SQL[] {
  if (!sorts?.length) return [sql`position ASC`]

  return sorts.map((rule) => {
    const path = propertyExpr(rule.propertyId)
    const direction = rule.direction === 'desc' ? sql`DESC` : sql`ASC`
    return sql`${path} ${direction}`
  })
}
