import { cn } from '@/lib/cn'
import type { ConnectionStatus } from '../types'

type EditorConnectionNoticeProps = {
  connectionStatus: ConnectionStatus
}

type Notice = {
  message: string
  tone: 'warn' | 'error'
}

function getNotice(connectionStatus: ConnectionStatus): Notice | null {
  if (connectionStatus === 'disconnected') {
    return {
      message: "You're offline. Edits stay on this device until you're back online.",
      tone: 'error',
    }
  }

  if (connectionStatus === 'auth_expired') {
    return {
      message: 'Your session expired. Refresh the page to keep syncing.',
      tone: 'error',
    }
  }

  if (connectionStatus === 'reconnecting') {
    return {
      message: 'Reconnecting… Your latest edits are kept locally.',
      tone: 'warn',
    }
  }

  return null
}

export function EditorConnectionNotice({ connectionStatus }: EditorConnectionNoticeProps) {
  const notice = getNotice(connectionStatus)
  if (!notice) return null

  return (
    <div
      role="status"
      className={cn(
        'mb-3 rounded-lg border-l-2 px-3 py-2 text-xs leading-relaxed tracking-dashboard',
        notice.tone === 'error' &&
          'border-red-400/70 bg-red-500/[0.06] text-red-300/90',
        notice.tone === 'warn' &&
          'border-yellow-500/70 bg-yellow-500/[0.06] text-yellow-200/85',
      )}
    >
      {notice.message}
    </div>
  )
}
