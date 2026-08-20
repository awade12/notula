import { Hocuspocus } from '@hocuspocus/server'
import type { Auth } from '../modules/auth/config'
import type { Db } from '../db/client'
import { createOnAuthenticate } from './hooks/on-authenticate'
import { createOnLoadDocument } from './hooks/on-load-document'
import { createOnStoreDocument } from './hooks/on-store-document'

export function createCollabServer(deps: { auth: Auth; db: Db; authSecret: string }) {
  const onAuthenticate = createOnAuthenticate({ db: deps.db })
  const onLoadDocument = createOnLoadDocument(deps)

  const collab = new Hocuspocus({
    name: 'notesapp',
    debounce: 500,
    maxDebounce: 3000,
    async onAuthenticate(data) {
      return onAuthenticate({
        token: data.token,
        documentName: data.documentName,
        connection: data.connection,
      })
    },
    async onLoadDocument(data) {
      return onLoadDocument({
        documentName: data.documentName,
      })
    },
  })

  const onStoreDocument = createOnStoreDocument({
    db: deps.db,
    collab,
    authSecret: deps.authSecret,
  })

  collab.configure({
    async onStoreDocument(data) {
      await onStoreDocument({
        documentName: data.documentName,
        document: data.document,
      })
    },
  })

  return collab
}

export function pageDocumentName(pageId: string) {
  return `page:${pageId}`
}

export function databaseDocumentName(databaseId: string) {
  return `database:${databaseId}`
}
