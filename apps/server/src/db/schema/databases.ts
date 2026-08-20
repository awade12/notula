import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import type { DatabaseSchema, DatabaseViewConfig } from '@notesapp/shared'
import { spaces } from './spaces'

export type { DatabaseViewConfig }

export const databases = pgTable('databases', {
  id: text('id').primaryKey(),
  spaceId: text('space_id')
    .notNull()
    .references(() => spaces.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  title: text('title').notNull().default('Untitled database'),
  icon: text('icon'),
  schema: jsonb('schema').$type<DatabaseSchema>().notNull(),
  isProjectBoard: boolean('is_project_board').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  publicSlug: text('public_slug'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const databaseViews = pgTable('database_views', {
  id: text('id').primaryKey(),
  databaseId: text('database_id')
    .notNull()
    .references(() => databases.id, { onDelete: 'cascade' }),
  spaceId: text('space_id')
    .notNull()
    .references(() => spaces.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('table'),
  title: text('title').notNull().default('Table'),
  config: jsonb('config').$type<DatabaseViewConfig>().notNull(),
  position: text('position').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const databaseRows = pgTable('database_rows', {
  id: text('id').primaryKey(),
  databaseId: text('database_id')
    .notNull()
    .references(() => databases.id, { onDelete: 'cascade' }),
  spaceId: text('space_id')
    .notNull()
    .references(() => spaces.id, { onDelete: 'cascade' }),
  properties: jsonb('properties').$type<Record<string, unknown>>().notNull(),
  position: text('position').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
