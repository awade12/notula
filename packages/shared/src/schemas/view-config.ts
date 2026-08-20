import { z } from 'zod'

export const filterOperatorSchema = z.enum([
  'is',
  'is_not',
  'is_empty',
  'is_not_empty',
  'contains',
])

export const filterRuleSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  operator: filterOperatorSchema,
  value: z.unknown().optional(),
})

export const sortRuleSchema = z.object({
  propertyId: z.string(),
  direction: z.enum(['asc', 'desc']),
})

export const databaseViewConfigSchema = z.object({
  propertyIds: z.array(z.string()),
  filters: z.array(filterRuleSchema).optional(),
  sorts: z.array(sortRuleSchema).optional(),
  groupByPropertyId: z.string().nullable().optional(),
})

export type FilterOperator = z.infer<typeof filterOperatorSchema>
export type FilterRule = z.infer<typeof filterRuleSchema>
export type SortRule = z.infer<typeof sortRuleSchema>
export type DatabaseViewConfig = z.infer<typeof databaseViewConfigSchema>
