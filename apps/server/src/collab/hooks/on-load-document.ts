import type { Db } from '../../db/client'
import { getPageYjsState } from '../../modules/pages/service'
import { parsePageDocumentName } from './on-authenticate'

export function createOnLoadDocument(deps: { db: Db }) {
  return async ({ documentName }: { documentName: string }) => {
    const pageId = parsePageDocumentName(documentName)
    if (!pageId) {
      return null
    }

    const state = await getPageYjsState(deps.db, pageId)
    if (!state) {
      return null
    }

    return new Uint8Array(state)
  }
}
