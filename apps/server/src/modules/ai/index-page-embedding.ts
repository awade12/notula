import { and, eq } from 'drizzle-orm'
import type { Db } from '../../db/client'
import { spaceMembers, spaces } from '../../db/schema/spaces'
import { userSettings } from '../../db/schema/user-settings'
import { indexPageEmbedding } from './embeddings'
import { decryptSecret } from '../../lib/crypto'
import { isPgvectorReady } from '../../lib/pgvector'

async function findSpaceEmbeddingApiKey(db: Db, spaceId: string, authSecret: string) {
  const [space] = await db
    .select({ ownerId: spaces.ownerId })
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1)

  if (!space) return null

  const memberRows = await db
    .select({ userId: spaceMembers.userId })
    .from(spaceMembers)
    .where(eq(spaceMembers.spaceId, spaceId))

  const candidateIds = [
    space.ownerId,
    ...memberRows.map((row) => row.userId).filter((id) => id !== space.ownerId),
  ]

  for (const userId of candidateIds) {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(
        and(eq(userSettings.userId, userId), eq(userSettings.aiEnableEmbeddings, true)),
      )
      .limit(1)

    if (!settings?.openrouterApiKeyEncrypted) continue

    try {
      return decryptSecret(settings.openrouterApiKeyEncrypted, authSecret)
    } catch {
      continue
    }
  }

  return null
}

export function schedulePageEmbeddingIndex(
  db: Db,
  authSecret: string,
  spaceId: string,
  pageId: string,
  title: string,
  plaintext: string,
) {
  void (async () => {
    try {
      if (!(await isPgvectorReady(db))) return

      const apiKey = await findSpaceEmbeddingApiKey(db, spaceId, authSecret)
      if (!apiKey) return

      await indexPageEmbedding(db, pageId, apiKey, title, plaintext)
    } catch (error) {
      console.error('Failed to index page embedding', { pageId, error })
    }
  })()
}
