import './load-env.js'
import { createServer } from 'node:http'
import { getRequestListener } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { WebSocketServer } from 'ws'
import { createCollabServer } from './collab/server'
import { createDb } from './db/client'
import { loadEnv } from './env'
import { errorHandler } from './middleware/error-handler'
import {
  createSessionMiddleware,
  type SessionVariables,
} from './middleware/session'
import { createAuth } from './modules/auth/config'
import { createAuthRoutes } from './modules/auth/routes'
import { createPagesRoutes } from './modules/pages/routes'
import { createSearchRoutes } from './modules/search/routes'
import { createSettingsRoutes } from './modules/settings/routes'
import { createAiRoutes } from './modules/ai/routes'
import { createInsightsRoutes } from './modules/insights/routes'
import { createSpacesRoutes } from './modules/spaces/routes'
import { createMembersRoutes } from './modules/spaces/members.routes'
import { createInvitesRoutes } from './modules/invites/routes'
import { createNotificationsRoutes, createSpaceNotificationRoutes } from './modules/notifications/routes'
import { createDatabasesRoutes } from './modules/databases/routes'
import { createPublicBoardsRoutes } from './modules/public-boards/routes'

const env = loadEnv()
const db = createDb(env)
const auth = createAuth(db, env)
const collab = createCollabServer({ auth, db, authSecret: env.BETTER_AUTH_SECRET })

const app = new Hono<{ Variables: SessionVariables }>()

app.use(
  '*',
  cors({
    origin: env.WEB_ORIGIN,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

app.use('*', createSessionMiddleware(auth))

app.get('/health', (c) => c.json({ ok: true }))

app.route('/api/auth', createAuthRoutes(auth))
app.route('/api/spaces', createSpacesRoutes(db))
app.route('/api/spaces/:spaceId/members', createMembersRoutes(db))
app.route('/api/spaces/:spaceId/notifications', createSpaceNotificationRoutes(db))
app.route('/api/invites', createInvitesRoutes(db))
app.route('/api/notifications', createNotificationsRoutes(db))
app.route('/api/spaces/:spaceId/pages', createPagesRoutes(db, env))
app.route('/api/spaces/:spaceId/databases', createDatabasesRoutes(db, collab))
app.route('/api/public', createPublicBoardsRoutes(db))
app.route('/api/spaces/:spaceId/search', createSearchRoutes(db, env))
app.route('/api/settings', createSettingsRoutes(db, env))
app.route('/api/ai', createAiRoutes(db, env))
app.route('/api/insights', createInsightsRoutes(db, collab))

app.get('/api/me', (c) => {
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ user: null, session: null })
  }

  return c.json({ user, session })
})

app.get('/api/collab/config', (c) => {
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const wsUrl = env.BETTER_AUTH_URL.replace(/^http/, 'ws') + '/collab'

  return c.json({
    url: wsUrl,
    token: session.token,
  })
})

app.onError((err, c) => errorHandler(err, c))

const listener = getRequestListener(app.fetch)
const httpServer = createServer(listener)
const wss = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (request, socket, head) => {
  const path = request.url?.split('?')[0] ?? ''
  if (path === '/collab' || path.startsWith('/collab/')) {
    wss.handleUpgrade(request, socket, head, (webSocket) => {
      collab.handleConnection(webSocket, request)
    })
    return
  }
  socket.destroy()
})

httpServer.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`)
})

export type AppType = typeof app
