import type { User } from '@blocknote/core'
import type { CommentData } from '@blocknote/core/comments'
import { CommentsExtension } from '@blocknote/core/comments'
import { useExtension } from '@blocknote/react'
import { useEffect, useState } from 'react'
import { extractCommentPlaintext } from '../../lib/extract-comment-plaintext'

type NotesCommentRowProps = {
  comment: CommentData
}

function formatCommentDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function useCommentAuthor(userId: string) {
  const { userStore } = useExtension(CommentsExtension)
  const [user, setUser] = useState<User | undefined>(() => userStore.getUser(userId))

  useEffect(() => {
    void userStore.loadUsers([userId])
    setUser(userStore.getUser(userId))

    return userStore.store.subscribe(() => {
      setUser(userStore.getUser(userId))
    })
  }, [userId, userStore])

  return user
}

export function NotesCommentRow({ comment }: NotesCommentRowProps) {
  const user = useCommentAuthor(comment.userId)
  const body = extractCommentPlaintext(comment.body)

  if (!body) return null

  const username = user?.username ?? '…'
  const edited = comment.updatedAt.getTime() !== comment.createdAt.getTime()

  return (
    <div className="notes-comment-row">
      <div className="notes-comment-row-header">
        <span
          className="notes-comment-row-avatar"
          style={user?.color ? { backgroundColor: user.color } : undefined}
          aria-hidden
        >
          {username.slice(0, 1).toUpperCase()}
        </span>
        <div className="notes-comment-row-meta">
          <span className="notes-comment-row-author">{username}</span>
          <span className="notes-comment-row-date">
            {formatCommentDate(comment.createdAt)}
            {edited ? ' · edited' : ''}
          </span>
        </div>
      </div>
      <p className="notes-comment-row-body">{body}</p>
    </div>
  )
}
