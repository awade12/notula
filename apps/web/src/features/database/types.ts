import type { DatabaseSchema, DatabaseViewConfig, PropertyDefinition } from '@notesapp/shared'

export type DatabaseView = {
  id: string
  type: string
  title: string
  config: DatabaseViewConfig
  position: string
}

export type Database = {
  id: string
  spaceId: string
  parentId: string | null
  title: string
  icon: string | null
  schema: DatabaseSchema
  views: DatabaseView[]
  isPublic?: boolean
  publicSlug?: string | null
  updatedAt: string
}

export type DatabaseSummary = {
  id: string
  spaceId: string
  parentId: string | null
  title: string
  icon: string | null
  updatedAt: string
}

export type DatabaseRow = {
  id: string
  databaseId: string
  properties: Record<string, unknown>
  position: string
  updatedAt: string
}

export type RowCellContext = {
  rowId: string
  property: PropertyDefinition
  value: unknown
}
