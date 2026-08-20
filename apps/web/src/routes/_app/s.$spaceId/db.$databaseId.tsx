import { createFileRoute } from '@tanstack/react-router'
import { DatabaseShell } from '@/features/database/components/database-shell'

export const Route = createFileRoute('/_app/s/$spaceId/db/$databaseId')({
  ssr: false,
  component: DatabaseRoute,
})

function DatabaseRoute() {
  const { spaceId, databaseId } = Route.useParams()
  return <DatabaseShell spaceId={spaceId} databaseId={databaseId} />
}
