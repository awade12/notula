import type { ReactNode } from 'react'
import { EditorConnectionNotice } from './editor-connection-notice'
import { EditorConnectionStatus } from './editor-connection-status'
import { useAppearancePreferences } from '@/features/settings/hooks/use-appearance'
import type { ConnectionStatus } from '../types'

type EditorShellProps = {
  connectionStatus: ConnectionStatus
  readOnly?: boolean
  children: ReactNode
}

export function EditorShell({
  connectionStatus,
  readOnly = false,
  children,
}: EditorShellProps) {
  const preferences = useAppearancePreferences()

  return (
    <div className="notes-editor-shell relative w-full pb-20 pt-1">
      {preferences.showConnectionBanner ? (
        <EditorConnectionNotice connectionStatus={connectionStatus} />
      ) : null}
      {children}
      <EditorConnectionStatus connectionStatus={connectionStatus} readOnly={readOnly} />
    </div>
  )
}
