import type { BlockNoteEditor } from '@blocknote/core'
import { CommentsExtension } from '@blocknote/core/comments'
import {
  useBlockNoteEditor,
  useComponentsContext,
  useExtension,
  useEditorState,
} from '@blocknote/react'
import { useCallback, useEffect, useRef } from 'react'

type NotesCommentComposerProps = {
  newCommentEditor: BlockNoteEditor<any, any, any>
}

export function NotesCommentComposer({ newCommentEditor }: NotesCommentComposerProps) {
  const editor = useBlockNoteEditor()
  const comments = useExtension(CommentsExtension)
  const Components = useComponentsContext()!
  const isEmpty = useEditorState({
    editor: newCommentEditor,
    selector: ({ editor: commentEditor }) => commentEditor.isEmpty,
  })

  const onSave = useCallback(async () => {
    if (isEmpty) return

    await comments.createThread({
      initialComment: {
        body: newCommentEditor.document,
      },
    })
    comments.stopPendingComment()
    editor.focus()
  }, [comments, editor, isEmpty, newCommentEditor])

  const composerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = composerRef.current
    if (!root) return

    const onKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent
      if (keyboardEvent.key !== 'Enter' || (!keyboardEvent.metaKey && !keyboardEvent.ctrlKey)) {
        return
      }
      keyboardEvent.preventDefault()
      void onSave()
    }

    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [onSave])

  return (
    <div
      ref={composerRef}
      className="notes-comment-popover notes-comment-popover--composer"
    >
      <Components.Comments.Editor
        autoFocus
        className="bn-comment-editor notes-comment-editor"
        editor={newCommentEditor}
        editable
      />
      {!isEmpty ? (
        <div className="notes-comment-popover-footer">
          <span className="notes-comment-popover-hint">⌘↵ to post</span>
          <button
            type="button"
            className="notes-comment-post-btn"
            onClick={() => void onSave()}
          >
            Post
          </button>
        </div>
      ) : null}
    </div>
  )
}
