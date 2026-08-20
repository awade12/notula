function normalizeCookieDomain(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`
}

export function resolveSharedCookieDomain(webOrigin: string, authUrl: string): string | undefined {
  const explicit = process.env.AUTH_COOKIE_DOMAIN?.trim()
  if (explicit) return normalizeCookieDomain(explicit)

  try {
    const webHost = new URL(webOrigin).hostname
    const authHost = new URL(authUrl).hostname

    if (webHost === authHost) return undefined
    if (webHost === 'localhost' || authHost === 'localhost') return undefined
    if (webHost.endsWith('.localhost') || authHost.endsWith('.localhost')) return undefined

    const webParts = webHost.split('.')
    const authParts = authHost.split('.')
    if (webParts.length < 2 || authParts.length < 2) return undefined

    const webParent = webParts.slice(-2).join('.')
    const authParent = authParts.slice(-2).join('.')
    if (webParent !== authParent) return undefined

    return `.${webParent}`
  } catch {
    return undefined
  }
}
