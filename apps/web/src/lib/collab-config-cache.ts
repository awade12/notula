import { apiFetch } from './api'

export type CollabConfig = {
  url: string
  token: string
}

let cachedConfig: CollabConfig | null = null
let inflight: Promise<CollabConfig | null> | null = null

async function fetchCollabConfig(): Promise<CollabConfig | null> {
  const response = await apiFetch('/api/collab/config')
  if (!response.ok) return null
  return response.json() as Promise<CollabConfig>
}

export function peekCollabConfig() {
  return cachedConfig
}

export async function getCollabConfig(options?: { force?: boolean }) {
  if (!options?.force && cachedConfig) {
    return cachedConfig
  }

  if (!options?.force && inflight) {
    return inflight
  }

  inflight = fetchCollabConfig()
    .then((config) => {
      if (config) cachedConfig = config
      inflight = null
      return config
    })
    .catch(() => {
      inflight = null
      return null
    })

  return inflight
}

export function invalidateCollabConfig() {
  cachedConfig = null
}

export function warmCollabConfig() {
  void getCollabConfig()
}
