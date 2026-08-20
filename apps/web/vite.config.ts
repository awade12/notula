import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(appDir, '../..')
const proIconPack = path.resolve(appDir, 'node_modules/@hugeicons-pro/core-stroke-rounded')
const freeIconPack = path.resolve(appDir, 'node_modules/@hugeicons/core-free-icons')

const config = defineConfig({
  envDir: rootDir,
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
  build: {
    sourcemap: false,
  },
  ssr: {
    noExternal: [/@tanstack\//, 'react', 'react-dom', 'framer-motion'],
  },
  resolve: {
    dedupe: ['@tanstack/store', '@tanstack/react-store', 'react', 'react-dom', 'yjs'],
    alias: existsSync(proIconPack)
      ? {}
      : {
          '@hugeicons-pro/core-stroke-rounded': freeIconPack,
        },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

export default config
