import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function errorHandler(err: Error, c: Context) {
  console.error(err)

  const status: ContentfulStatusCode =
    err.message === 'Unauthorized'
      ? 401
      : err.message === 'Forbidden'
        ? 403
        : err.message === 'Not found'
          ? 404
          : 500

  return c.json({ error: err.message }, status)
}
