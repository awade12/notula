import { spawnWorkspaceScript } from './lib/pm.mjs'

const children = [
  spawnWorkspaceScript('@notesapp/web', 'dev'),
  spawnWorkspaceScript('@notesapp/server', 'dev'),
]

let shuttingDown = false

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal)
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    shutdown(signal ?? 'SIGTERM')
    process.exit(code ?? 1)
  })
}

console.log('Web:    http://localhost:3000')
console.log('API/WS: http://localhost:3001')
