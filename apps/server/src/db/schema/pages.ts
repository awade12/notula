import { sql } from 'drizzle-orm'
import { customType, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { spaces } from './spaces'

const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() {
    return 'bytea'
  },
})

const embeddingVector = customType<{ data: number[] | null; driverData: string | null }>({
  dataType() {
    return 'vector(1536)'
  },
  toDriver(value) {
    if (!value || value.length === 0) return null
    return `[${value.join(',')}]`
  },
  fromDriver(value) {
    if (typeof value !== 'string') return null
    const trimmed = value.replace(/^\[|\]$/g, '')
    if (!trimmed) return []
    return trimmed.split(',').map((part) => Number(part))
  },
})

export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  spaceId: text('space_id')
    .notNull()
    .references(() => spaces.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  kind: text('kind').notNull().default('note'),
  title: text('title').notNull().default('Untitled'),
  position: text('position').notNull(),
  icon: text('icon'),
  plaintext: text('plaintext').notNull().default(''),
  openCommentCount: integer('open_comment_count').notNull().default(0),
  embedding: embeddingVector('embedding'),
  yjsState: bytea('yjs_state'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const pagesEmbeddingDimensions = 1536

export function embeddingLiteral(values: number[]) {
  return sql.raw(`'[${values.join(',')}]'::vector`)
}
