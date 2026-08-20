import type { BlockNoteEditor } from '@blocknote/core'
import { CommentsExtension } from '@blocknote/core/comments'
import { useComponentsContext, useExtension, useEditorState } from '@blocknote/react'
import { useCallback } from 'react'
import { cn } from '@/lib/cn'

import { notifyCommentParticipants } from '@/features/notifications/hooks/use-notifications'

type NotesCommentReplyFormProps = {
  editor: BlockNoteEditor<any, any, any>
  threadId: string
  spaceId?: string
  pageId?: string
  pageTitle?: string
  recipientUserIds?: string[]
  onClose: () => void
}

export function NotesCommentReplyForm({
  editor,
  threadId,
  spaceId,
  pageId,
  pageTitle,
  recipientUserIds = [],
  onClose,
}: NotesCommentReplyFormProps) {
  const comments = useExtension(CommentsExtension)
  const Components = useComponentsContext()!
  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: replyEditor }) => replyEditor.isEmpty,
  })

  const onReplySave = useCallback(async () => {
    if (isEmpty) return

    await comments.threadStore.addComment({
      comment: {
        body: editor.document,
      },
      threadId,
    })

    editor.removeBlocks(editor.document)
    onClose()

    if (spaceId && pageId && pageTitle && recipientUserIds.length > 0) {
      void notifyCommentParticipants({
        spaceId,
        pageId,
        pageTitle,
        recipientUserIds,
      })
    }
  }, [comments, editor, isEmpty, onClose, pageId, pageTitle, recipientUserIds, spaceId, threadId])

  return (
    <div className="notes-comment-thread-reply">
      <Components.Comments.Editor
        autoFocus
        className="bn-comment-editor notes-comment-editor"
        editor={editor}
        editable
      />
      <div className="notes-comment-popover-footer">
        <button type="button" className="notes-comment-reply-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={cn('notes-comment-post-btn', isEmpty && 'notes-comment-post-btn--disabled')}
          disabled={isEmpty}
          onClick={() => void onReplySave()}
        >
          Reply
        </button>
      </div>
    </div>
  )
}
