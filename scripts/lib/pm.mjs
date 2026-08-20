import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function getRootDir() {
  return root
}

export function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? ''
  if (userAgent.startsWith('pnpm/')) return 'pnpm'
  if (userAgent.startsWith('bun/')) return 'bun'
  if (userAgent.startsWith('yarn/')) return 'yarn'
  if (userAgent.startsWith('npm/')) return 'npm'
  if (fs.existsSync(path.join(root, 'bun.lock'))) return 'bun'
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  return 'npm'
}

export function workspaceArgs(packageManager, packageName, script) {
  switch (packageManager) {
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['--filter', packageName, 'run', script],
      }
    case 'bun':
      return {
        command: 'bun',
        args: ['run', '--filter', packageName, script],
      }
    case 'yarn':
      return {
        command: 'yarn',
        args: ['workspace', packageName, script],
      }
    default:
      return {
        command: 'npm',
        args: ['run', script, '-w', packageName],
      }
  }
}

export function runWorkspaceScript(
  packageName,
  script,
  { stdio = 'inherit', cwd = root } = {},
) {
  const packageManager = detectPackageManager()
  const { command, args } = workspaceArgs(packageManager, packageName, script)
  const result = spawnSync(command, args, {
    cwd,
    stdio,
    shell: process.platform === 'win32',
    env: process.env,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  return result
}

export function spawnWorkspaceScript(
  packageName,
  script,
  { cwd = root, env = process.env } = {},
) {
  const packageManager = detectPackageManager()
  const { command, args } = workspaceArgs(packageManager, packageName, script)

  return spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  })
}
