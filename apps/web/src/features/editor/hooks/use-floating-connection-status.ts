import { useEffect, useState } from 'react'
import type { ConnectionStatus } from '../types'

const SYNCED_HIDE_MS = 2400

function shouldPersistStatus(connectionStatus: ConnectionStatus, readOnly: boolean) {
  if (readOnly) return false
  return (
    connectionStatus === 'connecting' ||
    connectionStatus === 'reconnecting' ||
    connectionStatus === 'disconnected' ||
    connectionStatus === 'auth_expired'
  )
}

export function useFloatingConnectionStatus(
  connectionStatus: ConnectionStatus,
  readOnly: boolean,
) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (shouldPersistStatus(connectionStatus, readOnly)) {
      setVisible(true)
      return
    }

    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), SYNCED_HIDE_MS)
    return () => window.clearTimeout(timer)
  }, [connectionStatus, readOnly])

  return visible
}
