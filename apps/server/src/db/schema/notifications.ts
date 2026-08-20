import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { spaces } from './spaces'

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  spaceId: text('space_id').references(() => spaces.id, { onDelete: 'cascade' }),
  pageId: text('page_id'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
