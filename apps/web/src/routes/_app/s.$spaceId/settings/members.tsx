import { createFileRoute } from '@tanstack/react-router'
import { SpaceMembersPanel } from '@/features/workspace/components/members/space-members-panel'

export const Route = createFileRoute('/_app/s/$spaceId/settings/members')({
  component: SpaceMembersPage,
})

function SpaceMembersPage() {
  const { spaceId } = Route.useParams()

  return (
    <div className="mx-auto w-full max-w-2xl px-main py-8">
      <header className="mb-6">
        <p className="text-meta tracking-dashboard text-text-primary">Space</p>
        <h1 className="mt-1 text-2xl font-medium tracking-dashboard text-text-emphasis">Members</h1>
        <p className="mt-2 text-sm tracking-dashboard text-text-primary">
          Invite collaborators and manage roles.
        </p>
      </header>
      <SpaceMembersPanel spaceId={spaceId} />
    </div>
  )
}
