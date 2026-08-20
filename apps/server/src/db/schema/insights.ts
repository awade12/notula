import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { pages } from './pages'
import { spaces } from './spaces'

export const pageInsights = pgTable(
  'page_insights',
  {
    id: text('id').primaryKey(),
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    content: text('content').notNull().default(''),
    status: text('status').notNull(),
    owner: text('owner').notNull().default(''),
    source: text('source').notNull().default(''),
    supersedes: text('supersedes').notNull().default(''),
    dueDate: text('due_date').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('page_insights_space_kind_status_idx').on(
      table.spaceId,
      table.kind,
      table.status,
    ),
    index('page_insights_page_idx').on(table.pageId),
    index('page_insights_updated_idx').on(table.updatedAt),
  ],
)
