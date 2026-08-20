import type { FilterRule, PropertyDefinition } from '@notesapp/shared'

export const OPERATOR_LABELS: Record<FilterRule['operator'], string> = {
  contains: 'Contains',
  is: 'Is',
  is_not: 'Is not',
  is_empty: 'Is empty',
  is_not_empty: 'Is not empty',
}

export function getOperatorsForProperty(
  property: PropertyDefinition | undefined,
): FilterRule['operator'][] {
  if (!property) return ['is', 'is_not', 'is_empty', 'is_not_empty']
  if (property.type === 'text') {
    return ['contains', 'is', 'is_not', 'is_empty', 'is_not_empty']
  }
  if (property.type === 'checkbox') {
    return ['is', 'is_not', 'is_empty', 'is_not_empty']
  }
  return ['is', 'is_not', 'is_empty', 'is_not_empty']
}

export function operatorNeedsValue(operator: FilterRule['operator']) {
  return !operator.includes('empty')
}
