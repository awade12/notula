import { CommentsExtension } from '@blocknote/core/comments'
import { useBlockNoteEditor, useExtension } from '@blocknote/react'
import { useEffect } from 'react'

const HIDE_DELAY_MS = 600
const POPOVER_SELECTOR = '.notes-comment-popover'
const MARK_SELECTOR = '.bn-thread-mark:not([data-orphan="true"])'

function getMarkFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  const mark = target.closest(MARK_SELECTOR)
  if (!mark) return null
  const threadId = mark.getAttribute('data-bn-thread-id')
  if (!threadId) return null
  return { mark, threadId }
}

function isInsideCommentUi(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest(POPOVER_SELECTOR) || target.closest(MARK_SELECTOR))
}

function isReplyActive() {
  return Boolean(document.querySelector(`${POPOVER_SELECTOR}[data-reply-active="true"]`))
}

export function CommentHoverController() {
  const editor = useBlockNoteEditor()
  const comments = useExtension(CommentsExtension)

  useEffect(() => {
    const root = editor.domElement
    if (!root) return

    let hideTimer: ReturnType<typeof setTimeout> | undefined
    let pinnedThreadId: string | null = null

    const clearHideTimer = () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = undefined
      }
    }

    const shouldKeepOpen = () => {
      if (comments.store.state.pendingComment) return true
      if (isReplyActive()) return true
      if (document.activeElement?.closest(POPOVER_SELECTOR)) return true
      if (pinnedThreadId && comments.store.state.selectedThreadId === pinnedThreadId) {
        return true
      }
      return false
    }

    const scheduleHide = () => {
      if (shouldKeepOpen()) return
      clearHideTimer()
      hideTimer = setTimeout(() => {
        if (shouldKeepOpen()) return
        pinnedThreadId = null
        comments.selectThread(undefined, false)
      }, HIDE_DELAY_MS)
    }

    const onPointerOver = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (comments.store.state.pendingComment) return

      if (event.target.closest(POPOVER_SELECTOR)) {
        clearHideTimer()
        return
      }

      const thread = getMarkFromTarget(event.target)
      if (!thread) return

      clearHideTimer()
      if (comments.store.state.selectedThreadId !== thread.threadId) {
        comments.selectThread(thread.threadId, false)
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return

      const mark = getMarkFromTarget(event.target)
      if (mark) {
        pinnedThreadId = mark.threadId
        clearHideTimer()
        comments.selectThread(mark.threadId, false)
        return
      }

      if (event.target.closest(POPOVER_SELECTOR)) {
        clearHideTimer()
        return
      }

      if (!isInsideCommentUi(event.target)) {
        pinnedThreadId = null
        scheduleHide()
      }
    }

    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest(POPOVER_SELECTOR)) {
        clearHideTimer()
      }
    }

    const onFocusOut = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Element)) {
        scheduleHide()
        return
      }
      if (
        !event.relatedTarget.closest(POPOVER_SELECTOR) &&
        !event.relatedTarget.closest(MARK_SELECTOR)
      ) {
        scheduleHide()
      }
    }

    const onPointerOut = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (!comments.store.state.selectedThreadId) return

      const related = event.relatedTarget
      if (related instanceof Element && isInsideCommentUi(related)) return

      if (isInsideCommentUi(event.target)) {
        scheduleHide()
      }
    }

    root.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerout', onPointerOut, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      clearHideTimer()
      root.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerout', onPointerOut, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [comments, editor])

  return null
}
