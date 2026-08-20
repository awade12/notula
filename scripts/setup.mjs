import { spawnSync } from 'node:child_process'
import { detectPackageManager, getRootDir } from './lib/pm.mjs'

const root = getRootDir()
const packageManager = detectPackageManager()

console.log(`Using ${packageManager} workspaces`)

if (!process.env.SKIP_INSTALL) {
  const installArgs =
    packageManager === 'pnpm'
      ? ['install']
      : packageManager === 'bun'
        ? ['install']
        : ['install']

  const install = spawnSync(packageManager, installArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (install.status !== 0) {
    process.exit(install.status ?? 1)
  }
}

const prepare = spawnSync(process.execPath, ['scripts/prepare-dev.mjs'], {
  cwd: root,
  stdio: 'inherit',
})

if (prepare.status !== 0) {
  process.exit(prepare.status ?? 1)
}

console.log('')
console.log('Setup complete. Start development with:')
console.log(`  ${packageManager} run dev`)
