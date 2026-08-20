import { createFileRoute } from '@tanstack/react-router'
import { FolderBrowser } from '@/features/workspace/components/folder-browser/folder-browser'

export const Route = createFileRoute('/_app/s/$spaceId/')({
  component: SpaceIndexPage,
})

function SpaceIndexPage() {
  const { spaceId } = Route.useParams()
  return <FolderBrowser spaceId={spaceId} folderId={null} />
}
