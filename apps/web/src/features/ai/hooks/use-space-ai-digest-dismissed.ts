import { useCallback, useEffect, useState } from 'react'
import {
  dismissSpaceAiDigest,
  isSpaceAiDigestDismissed,
} from '../lib/space-ai-digest-dismissed'

export function useSpaceAiDigestDismissed(spaceId: string | undefined) {
  const [dismissed, setDismissed] = useState(() =>
    spaceId ? isSpaceAiDigestDismissed(spaceId) : false,
  )

  useEffect(() => {
    setDismissed(spaceId ? isSpaceAiDigestDismissed(spaceId) : false)
  }, [spaceId])

  const dismiss = useCallback(() => {
    if (!spaceId) return
    dismissSpaceAiDigest(spaceId)
    setDismissed(true)
  }, [spaceId])

  return { dismissed, dismiss }
}
