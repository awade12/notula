import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyDatabaseUrlFromEnv } from './database-url.js'

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rootDir = path.resolve(serverDir, '../..')

dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config({ path: path.join(serverDir, '.env'), override: true })
applyDatabaseUrlFromEnv()

export { rootDir, serverDir }
