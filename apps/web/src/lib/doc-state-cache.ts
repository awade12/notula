import { getUserPreferences } from '@/features/settings/stores/preferences-store'

const STORAGE_PREFIX = 'notes-doc:'

const cache = new Map<string, Uint8Array>()
const order: string[] = []

function getMaxEntries() {
  return getUserPreferences().offlineCacheMaxPages
}

function isCacheEnabled() {
  return getUserPreferences().enableOfflineCache
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function readSession(pageId: string) {
  if (!isCacheEnabled()) return null

  try {
    const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${pageId}`)
    if (!stored) return null
    return base64ToUint8Array(stored)
  } catch {
    return null
  }
}

function writeSession(pageId: string, state: Uint8Array) {
  if (!isCacheEnabled()) return

  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${pageId}`, uint8ArrayToBase64(state))
  } catch {
    // skip oversized entries
  }
}

function trimCache() {
  const maxEntries = getMaxEntries()
  while (order.length > maxEntries) {
    const oldest = order.shift()
    if (oldest) {
      cache.delete(oldest)
      try {
        sessionStorage.removeItem(`${STORAGE_PREFIX}${oldest}`)
      } catch {
        // ignore
      }
    }
  }
}

export function getDocState(pageId: string) {
  if (!isCacheEnabled()) return null

  const memory = cache.get(pageId)
  if (memory) return memory

  const stored = readSession(pageId)
  if (stored) {
    cache.set(pageId, stored)
    if (!order.includes(pageId)) {
      order.push(pageId)
    }
    return stored
  }

  return null
}

export function setDocState(pageId: string, state: Uint8Array) {
  if (!isCacheEnabled() || state.length === 0) return

  if (!cache.has(pageId)) {
    order.push(pageId)
  }

  cache.set(pageId, state)
  writeSession(pageId, state)
  trimCache()
}

export function hasDocState(pageId: string) {
  if (!isCacheEnabled()) return false
  return cache.has(pageId) || readSession(pageId) !== null
}

export function clearDocStateCache() {
  for (const pageId of [...order]) {
    cache.delete(pageId)
    try {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${pageId}`)
    } catch {
      // ignore
    }
  }
  order.length = 0
}

export function getDocStateCacheStats() {
  let approxBytes = 0
  for (const pageId of order) {
    const state = cache.get(pageId)
    if (state) approxBytes += state.length
  }

  return {
    count: order.length,
    approxKb: Math.round(approxBytes / 1024),
  }
}
