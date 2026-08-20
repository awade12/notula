import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { PageHoverPreview } from '@/features/links/components/page-hover-preview'
import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'

type PageMentionLinkProps = {
  spaceId: string
  pageId: string
  title: string
}

export function PageMentionLink({ spaceId, pageId, title }: PageMentionLinkProps) {
  const { openMentionsInNewTab } = useUserPreferences()

  return (
    <PageHoverPreview spaceId={spaceId} pageId={pageId}>
      <Link
        to="/s/$spaceId/p/$pageId"
        params={{ spaceId, pageId }}
        className="notes-page-mention"
        target={openMentionsInNewTab ? '_blank' : undefined}
        rel={openMentionsInNewTab ? 'noopener noreferrer' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <FileText size={13} strokeWidth={2} />
        <span>{title}</span>
      </Link>
    </PageHoverPreview>
  )
}
