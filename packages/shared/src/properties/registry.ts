import type { PropertyDefinition } from '../schemas/database'

export function findProperty(
  properties: PropertyDefinition[],
  propertyId: string,
): PropertyDefinition | undefined {
  return properties.find((property) => property.id === propertyId)
}

export function getPropertyLabel(type: PropertyDefinition['type']): string {
  switch (type) {
    case 'text':
      return 'Text'
    case 'number':
      return 'Number'
    case 'checkbox':
      return 'Checkbox'
    case 'select':
      return 'Select'
    case 'multi_select':
      return 'Multi-select'
    case 'relation':
      return 'Relation'
  }
}
