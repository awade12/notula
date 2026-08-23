import type { Db } from '../../db/client'
import { findSpaceEmbeddingApiKey } from './find-space-embedding-api-key'
import { getUserAiConfig } from '../settings/service'

export async function resolveSearchEmbeddingApiKey(
  db: Db,
  spaceId: string,
  userId: string,
  authSecret: string,
) {
  const aiConfig = await getUserAiConfig(db, userId, authSecret)
  if (aiConfig.enableEmbeddings && aiConfig.apiKey) {
    return aiConfig.apiKey
  }

  return findSpaceEmbeddingApiKey(db, spaceId, authSecret)
}
