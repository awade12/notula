import type { PropertyDefinition } from '../schemas/database'

export type PropertyValue = string | number | boolean | null | string[]

export function parseCellValue(
  property: PropertyDefinition,
  value: unknown,
): PropertyValue {
  switch (property.type) {
    case 'text': {
      if (value === null || value === undefined) return ''
      if (typeof value !== 'string') {
        throw new Error(`Invalid text value for ${property.name}`)
      }
      return value.slice(0, 2000)
    }
    case 'number': {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new Error(`Invalid number for ${property.name}`)
        return value
      }
      if (typeof value === 'string') {
        const parsed = Number(value)
        if (!Number.isFinite(parsed)) {
          throw new Error(`Invalid number for ${property.name}`)
        }
        return parsed
      }
      throw new Error(`Invalid number for ${property.name}`)
    }
    case 'checkbox': {
      if (typeof value !== 'boolean') {
        throw new Error(`Invalid checkbox value for ${property.name}`)
      }
      return value
    }
    case 'select': {
      if (value === null || value === undefined || value === '') return null
      if (typeof value !== 'string') {
        throw new Error(`Invalid select value for ${property.name}`)
      }
      const options = property.config?.options ?? []
      if (options.length > 0 && !options.some((option) => option.id === value)) {
        throw new Error(`Invalid option for ${property.name}`)
      }
      return value
    }
    case 'multi_select': {
      if (value === null || value === undefined || value === '') return []
      const options = property.config?.options ?? []
      const limit = property.config?.limit ?? 10
      const rawIds =
        typeof value === 'string'
          ? [value]
          : Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string')
            : null
      if (!rawIds) {
        throw new Error(`Invalid multi-select value for ${property.name}`)
      }
      const ids = [...new Set(rawIds)]
      for (const id of ids) {
        if (options.length > 0 && !options.some((option) => option.id === id)) {
          throw new Error(`Invalid option for ${property.name}`)
        }
      }
      return ids.slice(0, limit)
    }
    case 'relation': {
      if (value === null || value === undefined) return []
      if (!Array.isArray(value)) {
        throw new Error(`Invalid relation value for ${property.name}`)
      }
      const limit = property.config?.limit ?? 10
      const ids = value.filter((item): item is string => typeof item === 'string')
      return [...new Set(ids)].slice(0, limit)
    }
  }
}
