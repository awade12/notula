import { Link } from '@tanstack/react-router'
import { PageHoverPreview } from '@/features/links/components/page-hover-preview'
import type { Backlink } from '../hooks/use-backlinks'

type BacklinkRowProps = {
  backlink: Backlink
  spaceId: string
}

export function BacklinkRow({ backlink, spaceId }: BacklinkRowProps) {
  return (
    <PageHoverPreview spaceId={spaceId} pageId={backlink.id}>
      <Link
        to="/s/$spaceId/p/$pageId"
        params={{ spaceId, pageId: backlink.id }}
        className="block truncate rounded-md px-2 py-1.5 text-xs tracking-dashboard text-text-primary/80 transition-colors duration-100 hover:bg-white/5 hover:text-text-primary"
      >
        {backlink.title}
      </Link>
    </PageHoverPreview>
  )
}
