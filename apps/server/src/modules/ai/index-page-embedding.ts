import type { Db } from '../../db/client'
import { indexPageEmbedding } from './embeddings'
import { findSpaceEmbeddingApiKey } from './find-space-embedding-api-key'
import { isPgvectorReady } from '../../lib/pgvector'

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
