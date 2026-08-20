import { describe, expect, test } from 'bun:test'
import { resolveSharedCookieDomain } from './cookie-domain'

describe('resolveSharedCookieDomain', () => {
  test('returns shared parent domain for sibling subdomains', () => {
    expect(
      resolveSharedCookieDomain(
        'https://notes.bluevistastudio.com',
        'https://api.bluevistastudio.com',
      ),
    ).toBe('.bluevistastudio.com')
  })

  test('returns undefined for same host', () => {
    expect(
      resolveSharedCookieDomain('https://localhost:3000', 'https://localhost:3001'),
    ).toBeUndefined()
  })

  test('respects AUTH_COOKIE_DOMAIN override', () => {
    process.env.AUTH_COOKIE_DOMAIN = 'bluevistastudio.com'
    expect(
      resolveSharedCookieDomain('https://notes.example.com', 'https://api.example.com'),
    ).toBe('.bluevistastudio.com')
    delete process.env.AUTH_COOKIE_DOMAIN
  })
})
