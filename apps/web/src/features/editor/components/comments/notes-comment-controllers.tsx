import {
  FloatingComposerController,
  FloatingThreadController,
  type ThreadProps,
} from '@blocknote/react'
import { NotesCommentComposer } from './notes-comment-composer'
import { NotesCommentThread } from './notes-comment-thread'

type NotesCommentControllersProps = {
  spaceId: string
  pageId: string
  pageTitle: string
}

export function NotesCommentControllers({
  spaceId,
  pageId,
  pageTitle,
}: NotesCommentControllersProps) {
  function Thread(props: ThreadProps) {
    return (
      <NotesCommentThread
        {...props}
        spaceId={spaceId}
        pageId={pageId}
        pageTitle={pageTitle}
      />
    )
  }

  return (
    <>
      <FloatingComposerController floatingComposer={NotesCommentComposer} />
      <FloatingThreadController floatingThread={Thread} />
    </>
  )
}
