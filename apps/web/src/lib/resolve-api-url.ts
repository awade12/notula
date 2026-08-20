function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizePublicUrl(raw: string): string {
  let value = raw.trim()
  if (value.startsWith('//')) {
    value = `https:${value}`
  } else if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }
  return value.replace(/\/$/, '')
}

function fqdnToPublicUrl(fqdn: string): string {
  let host = fqdn.trim()
  if (!host.includes('://') && /^[^:[\]/]+:\d+$/.test(host)) {
    host = host.slice(0, host.lastIndexOf(':'))
  }
  return normalizePublicUrl(host)
}

function tryParsePublicUrl(candidate: string | undefined): string | undefined {
  const value = emptyToUndefined(candidate)
  if (!value) return undefined

  const normalized = value.includes('://') ? normalizePublicUrl(value) : fqdnToPublicUrl(value)

  try {
    const parsed = new URL(normalized)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined
    return normalized
  } catch {
    return undefined
  }
}

export function resolveApiUrlFromEnv(
  env: Record<string, string | undefined>,
  fallbackOrigin?: string,
): string {
  const resolved =
    tryParsePublicUrl(env.VITE_API_URL) ??
    tryParsePublicUrl(env.SERVICE_FQDN_SERVER_3001) ??
    tryParsePublicUrl(env.SERVICE_FQDN_SERVER) ??
    tryParsePublicUrl(env.SERVICE_URL_SERVER)

  if (resolved) return resolved

  const fallback = emptyToUndefined(fallbackOrigin)
  if (fallback) {
    const fromFallback = tryParsePublicUrl(fallback)
    if (fromFallback) return fromFallback
  }

  return 'http://localhost:3001'
}

export function resolveClientApiUrl(fallbackOrigin?: string): string {
  if (typeof window !== 'undefined') {
    return ''
  }

  const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL : undefined
  return resolveApiUrlFromEnv({ VITE_API_URL: viteEnv }, fallbackOrigin)
}

export function resolveServerApiUrl(fallbackOrigin?: string): string {
  return resolveApiUrlFromEnv(
    {
      VITE_API_URL: process.env.VITE_API_URL,
      SERVICE_FQDN_SERVER_3001: process.env.SERVICE_FQDN_SERVER_3001,
      SERVICE_FQDN_SERVER: process.env.SERVICE_FQDN_SERVER,
      SERVICE_URL_SERVER: process.env.SERVICE_URL_SERVER,
    },
    fallbackOrigin,
  )
}
