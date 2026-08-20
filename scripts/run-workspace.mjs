import { runWorkspaceScript } from './lib/pm.mjs'

const [packageName, script] = process.argv.slice(2)

if (!packageName || !script) {
  console.error('Usage: node scripts/run-workspace.mjs <package> <script>')
  process.exit(1)
}

runWorkspaceScript(packageName, script)
