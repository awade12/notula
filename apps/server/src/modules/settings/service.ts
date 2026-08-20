import { eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { userSettings } from '../../db/schema/user-settings'
import { decryptSecret, encryptSecret, maskSecret } from '../../lib/crypto'
import {
  mergeAiFeatureFlags,
  parseAiFeatureFlags,
  type AiFeatureFlags,
} from '../ai/feature-flags'

export type AiSettingsResponse = {
  defaultModel: string
  enableEmbeddings: boolean
  hasApiKey: boolean
  apiKeyHint: string | null
  featureFlags: AiFeatureFlags
}

export type AiSettingsUpdate = {
  defaultModel?: string
  enableEmbeddings?: boolean
  apiKey?: string | null
  featureFlags?: Partial<AiFeatureFlags>
}


export async function getOrCreateUserSettings(db: Db, userId: string) {
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(userSettings)
    .values({ userId })
    .returning()

  return created!
}

export async function getAiSettings(
  db: Db,
  userId: string,
  authSecret: string,
): Promise<AiSettingsResponse> {
  const settings = await getOrCreateUserSettings(db, userId)
  let apiKeyHint: string | null = null

  if (settings.openrouterApiKeyEncrypted) {
    try {
      const decrypted = decryptSecret(settings.openrouterApiKeyEncrypted, authSecret)
      apiKeyHint = maskSecret(decrypted)
    } catch {
      apiKeyHint = 'invalid'
    }
  }

  return {
    defaultModel: settings.aiDefaultModel,
    enableEmbeddings: settings.aiEnableEmbeddings,
    hasApiKey: Boolean(settings.openrouterApiKeyEncrypted),
    apiKeyHint,
    featureFlags: parseAiFeatureFlags(settings.aiFeatureFlags),
  }
}

export async function updateAiSettings(
  db: Db,
  userId: string,
  authSecret: string,
  input: AiSettingsUpdate,
) {
  await getOrCreateUserSettings(db, userId)

  const updates: Partial<typeof userSettings.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.defaultModel !== undefined) {
    updates.aiDefaultModel = input.defaultModel
  }

  if (input.enableEmbeddings !== undefined) {
    updates.aiEnableEmbeddings = input.enableEmbeddings
  }

  if (input.apiKey !== undefined) {
    updates.openrouterApiKeyEncrypted =
      input.apiKey && input.apiKey.trim().length > 0
        ? encryptSecret(input.apiKey.trim(), authSecret)
        : null
  }

  if (input.featureFlags !== undefined) {
    const current = await getOrCreateUserSettings(db, userId)
    updates.aiFeatureFlags = mergeAiFeatureFlags({
      ...parseAiFeatureFlags(current.aiFeatureFlags),
      ...input.featureFlags,
    })
  }

  await db.update(userSettings).set(updates).where(eq(userSettings.userId, userId))

  return getAiSettings(db, userId, authSecret)
}

export async function getUserOpenRouterApiKey(db: Db, userId: string, authSecret: string) {
  const settings = await getOrCreateUserSettings(db, userId)
  if (!settings.openrouterApiKeyEncrypted) return null

  try {
    return decryptSecret(settings.openrouterApiKeyEncrypted, authSecret)
  } catch {
    return null
  }
}

export type UserPreferencesPayload = {
  appearance?: Record<string, unknown>
  user?: Record<string, unknown>
}

export async function getUserPreferences(db: Db, userId: string): Promise<UserPreferencesPayload> {
  const settings = await getOrCreateUserSettings(db, userId)
  const stored = settings.preferences ?? {}
  return {
    appearance: typeof stored.appearance === 'object' && stored.appearance !== null
      ? (stored.appearance as Record<string, unknown>)
      : {},
    user: typeof stored.user === 'object' && stored.user !== null
      ? (stored.user as Record<string, unknown>)
      : {},
  }
}

export async function updateUserPreferences(
  db: Db,
  userId: string,
  input: UserPreferencesPayload,
) {
  const current = await getUserPreferences(db, userId)

  const next = {
    appearance: { ...current.appearance, ...input.appearance },
    user: { ...current.user, ...input.user },
  }

  await getOrCreateUserSettings(db, userId)
  await db
    .update(userSettings)
    .set({ preferences: next, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))

  return next
}

export async function getUserAiConfig(db: Db, userId: string, authSecret: string) {
  const settings = await getOrCreateUserSettings(db, userId)
  const apiKey = settings.openrouterApiKeyEncrypted
    ? decryptSecret(settings.openrouterApiKeyEncrypted, authSecret)
    : null

  return {
    defaultModel: settings.aiDefaultModel,
    enableEmbeddings: settings.aiEnableEmbeddings,
    apiKey,
    featureFlags: parseAiFeatureFlags(settings.aiFeatureFlags),
  }
}
