import { useBacklinks } from '../hooks/use-backlinks'
import { BacklinkRow } from './backlink-row'

import { useUserPreferences } from '@/features/settings/hooks/use-user-preferences'

type BacklinksPanelProps = {
  spaceId: string
  pageId: string
}

export function BacklinksPanel({ spaceId, pageId }: BacklinksPanelProps) {
  const { showBacklinks } = useUserPreferences()
  const { data: backlinks } = useBacklinks(spaceId, pageId)

  if (!showBacklinks) return null

  if (!backlinks || backlinks.length === 0) {
    return null
  }

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-text-primary/50">
        Backlinks
      </h2>
      <ul className="space-y-0.5">
        {backlinks.map((backlink) => (
          <li key={backlink.id}>
            <BacklinkRow backlink={backlink} spaceId={spaceId} />
          </li>
        ))}
      </ul>
    </section>
  )
}
