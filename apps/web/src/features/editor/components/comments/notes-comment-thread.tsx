import { CommentsExtension } from '@blocknote/core/comments'
import type { ThreadProps } from '@blocknote/react'
import { useExtension } from '@blocknote/react'
import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { NotesCommentReplyForm } from './notes-comment-reply-form'
import { NotesCommentRow } from './notes-comment-row'

type NotesCommentThreadProps = ThreadProps & {
  spaceId?: string
  pageId?: string
  pageTitle?: string
}

export function NotesCommentThread({
  thread,
  newCommentEditor,
  spaceId,
  pageId,
  pageTitle,
}: NotesCommentThreadProps) {
  const comments = useExtension(CommentsExtension)
  const [replyOpen, setReplyOpen] = useState(false)

  const visibleComments = thread.comments.filter((comment) => comment.body)
  const recipientUserIds = visibleComments.map((comment) => comment.userId)

  const closeReply = () => {
    if (newCommentEditor && !newCommentEditor.isEmpty) {
      newCommentEditor.removeBlocks(newCommentEditor.document)
    }
    setReplyOpen(false)
  }

  return (
    <div
      className="notes-comment-popover notes-comment-popover--thread"
      data-reply-active={replyOpen ? 'true' : undefined}
    >
      <div className="notes-comment-thread-actions">
        {thread.resolved ? (
          <button
            type="button"
            className="notes-comment-action-btn"
            onClick={() => void comments.threadStore.unresolveThread({ threadId: thread.id })}
          >
            Reopen
          </button>
        ) : (
          <button
            type="button"
            className="notes-comment-action-btn"
            onClick={() => void comments.threadStore.resolveThread({ threadId: thread.id })}
          >
            <Check size={12} />
            Resolve
          </button>
        )}
        <button
          type="button"
          className="notes-comment-action-btn notes-comment-action-btn--danger"
          onClick={() => void comments.threadStore.deleteThread({ threadId: thread.id })}
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="notes-comment-thread-list">
        {visibleComments.map((comment) => (
          <NotesCommentRow key={comment.id} comment={comment} />
        ))}
      </div>

      {replyOpen && newCommentEditor ? (
        <NotesCommentReplyForm
          editor={newCommentEditor}
          threadId={thread.id}
          spaceId={spaceId}
          pageId={pageId}
          pageTitle={pageTitle}
          recipientUserIds={recipientUserIds}
          onClose={closeReply}
        />
      ) : (
        <button
          type="button"
          className="notes-comment-reply-trigger"
          onClick={() => setReplyOpen(true)}
        >
          Reply…
        </button>
      )}
    </div>
  )
}
