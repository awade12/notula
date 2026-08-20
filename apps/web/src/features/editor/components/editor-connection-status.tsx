import { cn } from '@/lib/cn'
import { useFloatingConnectionStatus } from '../hooks/use-floating-connection-status'
import type { ConnectionStatus } from '../types'

type EditorConnectionStatusProps = {
  connectionStatus: ConnectionStatus
  readOnly?: boolean
}

type StatusDisplay = {
  label: string
  dotClass: string
  textClass: string
}

function getStatusDisplay(
  connectionStatus: ConnectionStatus,
  readOnly: boolean,
): StatusDisplay {
  if (readOnly) {
    return {
      label: 'View only',
      dotClass: 'bg-muted-foreground/60',
      textClass: 'text-text-primary/40',
    }
  }

  switch (connectionStatus) {
    case 'synced':
      return {
        label: 'Synced',
        dotClass: 'bg-emerald-400/80',
        textClass: 'text-text-primary/40',
      }
    case 'connecting':
      return {
        label: 'Connecting…',
        dotClass: 'bg-yellow-400/90 animate-pulse',
        textClass: 'text-text-primary/50',
      }
    case 'reconnecting':
      return {
        label: 'Reconnecting…',
        dotClass: 'bg-yellow-400/90 animate-pulse',
        textClass: 'text-yellow-200/75',
      }
    case 'disconnected':
      return {
        label: 'Offline',
        dotClass: 'bg-red-400/90',
        textClass: 'text-red-300/80',
      }
    case 'auth_expired':
      return {
        label: 'Session expired',
        dotClass: 'bg-red-400/90',
        textClass: 'text-red-300/80',
      }
    default:
      return {
        label: 'Connecting…',
        dotClass: 'bg-yellow-400/90 animate-pulse',
        textClass: 'text-text-primary/50',
      }
  }
}

export function EditorConnectionStatus({
  connectionStatus,
  readOnly = false,
}: EditorConnectionStatusProps) {
  const visible = useFloatingConnectionStatus(connectionStatus, readOnly)
  const display = getStatusDisplay(connectionStatus, readOnly)
  const persist = !readOnly && connectionStatus !== 'synced'

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed z-40 flex items-center gap-1.5',
        'rounded-tl-[var(--radius-panel)] border-l border-t border-white/10 bg-surface/90 px-2 py-1',
        'text-[11px] tracking-dashboard backdrop-blur-sm',
        'transition-[opacity,transform] duration-300 ease-[var(--ease-sidebar-expand)]',
        display.textClass,
        visible || persist
          ? 'translate-y-0 opacity-100'
          : 'translate-y-1 opacity-0',
      )}
      style={{
        right: 'var(--spacing-panel)',
        bottom: 'var(--spacing-panel)',
      }}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', display.dotClass)} aria-hidden />
      {display.label}
    </div>
  )
}
