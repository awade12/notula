const STORAGE_PREFIX = 'notesapp:digest-dismissed:'

export function isSpaceAiDigestDismissed(spaceId: string) {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(`${STORAGE_PREFIX}${spaceId}`) === '1'
}

export function dismissSpaceAiDigest(spaceId: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(`${STORAGE_PREFIX}${spaceId}`, '1')
}
