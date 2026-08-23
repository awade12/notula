import '../../load-env.js'
import { createDb } from '../client'
import { loadEnv } from '../../env'
import { insertDemoWorkspace, listUsers } from './insert-demo-workspace'
import { DEMO_BOARD_TITLE } from './demo-content'

function readArg(name: string) {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

async function main() {
  const email = readArg('email')
  const force = process.argv.includes('--force')

  const env = loadEnv()
  const db = createDb(env)

  const users = await listUsers(db)
  if (users.length === 0) {
    console.error('No users found. Create an account in the app, then run: bun run db:seed')
    process.exit(1)
  }

  const result = await insertDemoWorkspace(db, { email, force })

  if (!result.created) {
    console.log(`Demo teamspace already exists: "${result.spaceName}"`)
    console.log(`Space ID: ${result.spaceId}`)
    console.log(`Owner: ${result.ownerEmail}`)
    if (result.repairedNotes) {
      console.log(`Repaired ${result.repairedNotes} notes with editor content.`)
    } else {
      console.log('Re-run with --force to delete and recreate it.')
    }
    process.exit(0)
  }

  console.log(`Created demo teamspace: "${result.spaceName}"`)
  console.log(`Space ID: ${result.spaceId}`)
  console.log(`Owner: ${result.ownerEmail}`)
  console.log('')
  console.log('Contents:')
  console.log(`  ${result.stats?.folders} folders`)
  console.log(`  ${result.stats?.notes} notes with cross-links`)
  console.log(`  ${result.stats?.links} page links`)
  console.log(`  ${result.stats?.tasks} project tasks on "${DEMO_BOARD_TITLE}"`)
  console.log(`  ${result.stats?.teammates} team members (including you)`)
  console.log('')
  console.log('Open the app, switch to "Acme Product (Demo)", and try:')
  console.log('  • AI panel on "Collab & AI Architecture" — ask about launch decisions')
  console.log('  • Project board "Sprint 42 — Launch" — task AI on linked tasks')
  console.log('  • Cmd+K search for "pricing" or "teamspace"')
  console.log('')
  console.log('Tip: enable embeddings in Settings → AI for semantic retrieval.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
