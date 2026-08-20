function encodeDatabaseUrlPart(value: string): string {
  return encodeURIComponent(value)
}

export function resolveDatabaseUrlFromEnv(): string | undefined {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim()
  }

  const user = process.env.PGUSER?.trim()
  const password = process.env.PGPASSWORD
  const host = process.env.PGHOST?.trim()
  const port = process.env.PGPORT?.trim() || '5432'
  const database = process.env.PGDATABASE?.trim()

  if (!user || password === undefined || !host || !database) {
    return undefined
  }

  return `postgresql://${encodeDatabaseUrlPart(user)}:${encodeDatabaseUrlPart(password)}@${host}:${port}/${encodeDatabaseUrlPart(database)}`
}

export function applyDatabaseUrlFromEnv(): void {
  const resolved = resolveDatabaseUrlFromEnv()
  if (resolved) {
    process.env.DATABASE_URL = resolved
  }
}
