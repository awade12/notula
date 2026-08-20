import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { pages } from './pages'
import { spaces } from './spaces'

export const pageLinks = pgTable(
  'page_links',
  {
    id: text('id').primaryKey(),
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    sourcePageId: text('source_page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    targetPageId: text('target_page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueLink: uniqueIndex('page_links_source_target_idx').on(
      table.sourcePageId,
      table.targetPageId,
    ),
    targetIdx: index('page_links_target_idx').on(table.targetPageId),
  }),
)
