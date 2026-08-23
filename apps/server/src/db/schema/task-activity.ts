import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { databaseRows } from './databases'
import { spaces } from './spaces'

export const taskActivity = pgTable('task_activity', {
  id: text('id').primaryKey(),
  rowId: text('row_id')
    .notNull()
    .references(() => databaseRows.id, { onDelete: 'cascade' }),
  spaceId: text('space_id')
    .notNull()
    .references(() => spaces.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  kind: text('kind').notNull(),
  body: text('body').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
