import type { QueryClient } from '@tanstack/react-query'
import * as Y from 'yjs'
import { getDocState, hasDocState } from '@/lib/doc-state-cache'
import { base64ToUint8Array, type PageBootstrap } from './page-bootstrap'

const BOOTSTRAP_ORIGIN = 'notes-bootstrap'
const PAGE_TITLE_YKEY = 'title'
const DOCUMENT_FRAGMENT = 'document-store'

export function docHasContent(doc: Y.Doc) {
  return (
    doc.getXmlFragment(DOCUMENT_FRAGMENT).length > 0 ||
    doc.getText(PAGE_TITLE_YKEY).length > 0
  )
}

export function isPageWarm(pageId: string, spaceId: string, queryClient: QueryClient) {
  if (hasDocState(pageId)) return true

  const bootstrap = queryClient.getQueryData<PageBootstrap>([
    'page-bootstrap',
    spaceId,
    pageId,
  ])

  return Boolean(bootstrap?.yjsState)
}

export function hydrateDoc(
  doc: Y.Doc,
  pageId: string,
  spaceId: string,
  queryClient: QueryClient,
) {
  const cached = getDocState(pageId)
  if (cached) {
    Y.applyUpdate(doc, cached)
    return docHasContent(doc)
  }

  const bootstrap = queryClient.getQueryData<PageBootstrap>([
    'page-bootstrap',
    spaceId,
    pageId,
  ])

  if (bootstrap?.yjsState) {
    Y.applyUpdate(doc, base64ToUint8Array(bootstrap.yjsState), BOOTSTRAP_ORIGIN)
    return docHasContent(doc)
  }

  return false
}

export function applyBootstrapToDoc(doc: Y.Doc, yjsState: string) {
  Y.applyUpdate(doc, base64ToUint8Array(yjsState), BOOTSTRAP_ORIGIN)
}

export { BOOTSTRAP_ORIGIN }
