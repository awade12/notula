import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'
import type { AiFeatureFlags } from '../../modules/ai/feature-flags'
import { DEFAULT_AI_FEATURE_FLAGS } from '../../modules/ai/feature-flags'

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  aiDefaultModel: text('ai_default_model').notNull().default('openai/gpt-4o-mini'),
  aiEnableEmbeddings: boolean('ai_enable_embeddings').notNull().default(false),
  aiFeatureFlags: jsonb('ai_feature_flags')
    .$type<AiFeatureFlags>()
    .notNull()
    .default(DEFAULT_AI_FEATURE_FLAGS),
  openrouterApiKeyEncrypted: text('openrouter_api_key_encrypted'),
  preferences: jsonb('preferences')
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
