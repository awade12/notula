import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const registryPath = join(root, 'src/features/workspace/lib/page-icon-registry.ts')
const outputPath = join(root, 'src/features/workspace/lib/page-icon-loader.client.ts')

const iconPackageJson = join(
  root,
  'node_modules/@hugeicons/core-free-icons/package.json',
)
const iconPackage = JSON.parse(readFileSync(iconPackageJson, 'utf8'))
const iconVersion = iconPackage.version
const iconEsmDir = join(
  root,
  'node_modules/@hugeicons/core-free-icons/dist/esm',
)

const source = readFileSync(registryPath, 'utf8')
const match = source.match(/const FEATURED_ICON_NAMES = \[([\s\S]*?)\] as const/)

if (!match) {
  console.error('[web] Could not find FEATURED_ICON_NAMES in page-icon-registry.ts')
  process.exit(1)
}

const iconNames = [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1])
const missing = iconNames.filter(
  (iconName) => !existsSync(join(iconEsmDir, `${iconName}.js`)),
)

if (missing.length > 0) {
  console.error('[web] Featured icons missing from @hugeicons/core-free-icons:')
  for (const iconName of missing) {
    console.error(`  - ${iconName}`)
  }
  process.exit(1)
}

const loaderEntries = iconNames
  .map(
    (iconName) =>
      `  ${iconName}: () => import('@hugeicons/core-free-icons/${iconName}').then((m) => m.default),`,
  )
  .join('\n')

const output = [
  "import '@tanstack/react-start/client-only'",
  "import type { IconSvgElement } from '@hugeicons/react'",
  "import iconNames from '@/features/workspace/lib/page-icon-search-index.json'",
  '',
  `const ICON_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@hugeicons/core-free-icons@${iconVersion}/dist/esm'`,
  '',
  'const iconNameSet = new Set<string>(iconNames)',
  '',
  'const featuredLoaders: Record<string, () => Promise<IconSvgElement>> = {',
  loaderEntries,
  '}',
  '',
  'export function iconExists(iconName: string): boolean {',
  '  return iconNameSet.has(iconName)',
  '}',
  '',
  'const cache = new Map<string, Promise<IconSvgElement>>()',
  '',
  'async function loadFromCdn(iconName: string): Promise<IconSvgElement> {',
  '  const module = await import(/* @vite-ignore */ `${ICON_CDN_BASE}/${iconName}.js`)',
  '  return module.default as IconSvgElement',
  '}',
  '',
  'export async function loadIcon(iconName: string): Promise<IconSvgElement> {',
  '  const cached = cache.get(iconName)',
  '  if (cached) return cached',
  '',
  '  const featured = featuredLoaders[iconName]',
  '  const promise = featured ? featured() : loadFromCdn(iconName)',
  '',
  '  cache.set(iconName, promise)',
  '  return promise',
  '}',
  '',
].join('\n')

writeFileSync(outputPath, output)
console.log(`[web] Generated page-icon-loader.client.ts with ${iconNames.length} featured icons`)
