import { CommentsExtension, DefaultThreadStoreAuth } from '@blocknote/core/comments'
import { YjsThreadStore, withCollaboration } from '@blocknote/core/yjs'
import type { ExtensionFactoryInstance } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { useEffect, useMemo, useRef } from 'react'
import type * as Y from 'yjs'
import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'
import { useSpaceMembers } from '@/features/workspace/hooks/use-space-members'
import { notesBlockSchema } from '../lib/block-schema'
import {
  createCommentUserStore,
  seedCommentMemberNames,
} from '../lib/comment-user-store'
import { editorDictionary, editorDomAttributes } from '../lib/editor-config'
import { inlineCardLineBreakExtension } from '../lib/inline-card-line-break-extension'
import { ghostCompletionExtension } from '../lib/ghost-completion-extension'
import { typographyShortcutsExtension } from '../lib/typography-shortcuts-extension'
import { userColor } from '../lib/user-color'

type UseEditorInstanceOptions = {
  doc: Y.Doc
  provider: HocuspocusProvider | null
  user: { id: string; name: string }
  spaceId: string
  canEdit?: boolean
}

export function useEditorInstance({
  doc,
  provider,
  user,
  spaceId,
  canEdit = true,
}: UseEditorInstanceOptions) {
  const { showRemoteCursors, cursorLabelMode } = useUserPreferences()
  const memberNamesRef = useRef(new Map<string, string>())
  const { data: members } = useSpaceMembers(spaceId)
  const commentUserStore = useMemo(
    () => createCommentUserStore(user, memberNamesRef),
    [user.id, user.name],
  )

  useEffect(() => {
    if (!members?.length) return
    seedCommentMemberNames(commentUserStore, memberNamesRef, members)
  }, [commentUserStore, members])
  const commentThreadStore = useMemo(
    () =>
      new YjsThreadStore(
        user.id,
        doc.getMap('threads'),
        new DefaultThreadStoreAuth(user.id, canEdit ? 'editor' : 'comment'),
      ),
    [canEdit, doc, user.id],
  )
  const commentsExtension = useMemo(
    () =>
      CommentsExtension({
        threadStore: commentThreadStore,
        resolveUsers: commentUserStore,
        confirmBeforeDiscard: true,
      }),
    [commentThreadStore, commentUserStore],
  )
  const baseOptions = {
    schema: notesBlockSchema,
    dictionary: editorDictionary,
    domAttributes: editorDomAttributes,
    animations: false,
    extensions: [
      inlineCardLineBreakExtension,
      ghostCompletionExtension,
      typographyShortcutsExtension,
      commentsExtension,
    ] as ExtensionFactoryInstance[],
  }

  const blocknoteCursorLabels =
    showRemoteCursors && cursorLabelMode !== 'never'
      ? cursorLabelMode === 'always'
        ? ('always' as const)
        : ('activity' as const)
      : undefined

  return useCreateBlockNote(
    withCollaboration({
      ...baseOptions,
      collaboration: {
        provider: provider?.awareness ? { awareness: provider.awareness } : {},
        fragment: doc.getXmlFragment('document-store'),
        user: {
          id: user.id,
          name: user.name,
          color: userColor(user.id),
        },
        ...(blocknoteCursorLabels ? { showCursorLabels: blocknoteCursorLabels } : {}),
      },
    }),
    [canEdit, doc, provider, user.id, user.name, showRemoteCursors, cursorLabelMode],
  )
}
