import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import handler from './dist/server/server.js'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const clientDir = join(rootDir, 'dist/client')
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function sendNodeResponse(nodeRes, webResponse) {
  nodeRes.statusCode = webResponse.status
  webResponse.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value)
  })

  if (!webResponse.body) {
    nodeRes.end()
    return
  }

  Readable.fromWeb(webResponse.body).pipe(nodeRes)
}

function tryServeStatic(pathname, req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false

  const safePath = pathname.replace(/\0/g, '')
  if (!safePath || safePath.includes('..')) return false

  const filePath = join(clientDir, safePath)
  if (!existsSync(filePath)) return false

  const stats = statSync(filePath)
  if (!stats.isFile()) return false

  const ext = extname(filePath)
  res.statusCode = 200
  res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable')

  if (req.method === 'HEAD') {
    res.end()
    return true
  }

  createReadStream(filePath).pipe(res)
  return true
}

async function toWebRequest(req) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const init = {
    method: req.method,
    headers: req.headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Request(url, {
      ...init,
      body: req,
      duplex: 'half',
    })
  }

  return new Request(url, init)
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

    if (tryServeStatic(url.pathname, req, res)) return

    const response = await handler.fetch(await toWebRequest(req))

    sendNodeResponse(res, response)
  } catch (error) {
    console.error('Web server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

server.listen(port, host, () => {
  console.log(`Web listening on http://${host}:${port}`)
})
