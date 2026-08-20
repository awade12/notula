import * as Y from 'yjs'
import type { Hocuspocus } from '@hocuspocus/server'
import type { Db } from '../../db/client'
import { schedulePageEmbeddingIndex } from '../../modules/ai/index-page-embedding'
import { syncPageInsightsFromCollab } from '../../modules/insights/service'
import { getPageForCollab, storePageDocument } from '../../modules/pages/service'
import { broadcastInsightsChanged } from '../broadcast'
import { extractInsights } from '../derive/extract-insights'
import { extractOpenCommentCount } from '../derive/extract-comment-count'
import { extractLinks, extractPlaintext, extractTitle } from '../derive/extract-plaintext'
import { parsePageDocumentName } from './on-authenticate'

export function createOnStoreDocument(deps: {
  db: Db
  collab: Hocuspocus
  authSecret: string
}) {
  return async ({
    documentName,
    document,
  }: {
    documentName: string
    document: Y.Doc
  }) => {
    const pageId = parsePageDocumentName(documentName)
    if (!pageId) {
      return
    }

    const page = await getPageForCollab(deps.db, pageId)
    if (!page) {
      return
    }

    const state = Y.encodeStateAsUpdate(document)
    const title = extractTitle(state)
    const plaintext = extractPlaintext(state)
    const linkIds = extractLinks(state)
    const insights = extractInsights(state)
    const openCommentCount = extractOpenCommentCount(state)

    await storePageDocument(deps.db, pageId, {
      state: Buffer.from(state),
      title,
      plaintext,
      linkIds,
      openCommentCount,
    })

    schedulePageEmbeddingIndex(
      deps.db,
      deps.authSecret,
      page.spaceId,
      pageId,
      title,
      plaintext,
    )

    await syncPageInsightsFromCollab(
      deps.db,
      page.spaceId,
      pageId,
      insights,
    )
    broadcastInsightsChanged(deps.collab, page.spaceId, pageId)
  }
}
