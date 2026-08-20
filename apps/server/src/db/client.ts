import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { Env } from '../env'
import * as schema from './schema'

export function createDb(env: Env) {
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  return drizzle(pool, { schema })
}

export type Db = ReturnType<typeof createDb>
