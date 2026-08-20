function encodePart(value) {
  return encodeURIComponent(value)
}

export function applyDatabaseUrlFromEnv() {
  if (process.env.DATABASE_URL?.trim()) return

  const user = process.env.PGUSER?.trim()
  const password = process.env.PGPASSWORD
  const host = process.env.PGHOST?.trim()
  const port = process.env.PGPORT?.trim() || '5432'
  const database = process.env.PGDATABASE?.trim()

  if (!user || password === undefined || !host || !database) return

  process.env.DATABASE_URL = `postgresql://${encodePart(user)}:${encodePart(password)}@${host}:${port}/${encodePart(database)}`
}
