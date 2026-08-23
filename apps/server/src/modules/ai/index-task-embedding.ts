import type { Db } from '../../db/client'
import { indexTaskEmbedding } from './embeddings'
import { isPgvectorReady } from '../../lib/pgvector'
import { findSpaceEmbeddingApiKey } from './find-space-embedding-api-key'

export function scheduleTaskEmbeddingIndex(
  db: Db,
  authSecret: string,
  spaceId: string,
  rowId: string,
  boardTitle: string,
  title: string,
  description: string,
) {
  void (async () => {
    try {
      if (!(await isPgvectorReady(db))) return

      const apiKey = await findSpaceEmbeddingApiKey(db, spaceId, authSecret)
      if (!apiKey) return

      await indexTaskEmbedding(db, rowId, apiKey, boardTitle, title, description)
    } catch (error) {
      console.error('Failed to index task embedding', { rowId, error })
    }
  })()
}
