import { useSyncExternalStore } from 'react'
import { getPendingPageId, subscribePendingPageId } from '../stores/pending-page-id'

export function usePendingPageId() {
  return useSyncExternalStore(subscribePendingPageId, getPendingPageId, getPendingPageId)
}
