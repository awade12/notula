import { CheckCircle2, Radio } from 'lucide-react'
import type { InsightKind } from '@/features/insights/types'

export const knowledgeKindConfig = {
  decision: {
    label: 'Decision',
    shortLabel: 'Decision',
    icon: CheckCircle2,
    statuses: [
      { value: 'draft', label: 'Draft' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'superseded', label: 'Superseded' },
    ],
  },
  signal: {
    label: 'Signal',
    shortLabel: 'Signal',
    icon: Radio,
    statuses: [
      { value: 'observed', label: 'Observed' },
      { value: 'dismissed', label: 'Dismissed' },
    ],
  },
} as const satisfies Record<
  InsightKind,
  {
    label: string
    shortLabel: string
    icon: typeof CheckCircle2
    statuses: ReadonlyArray<{ value: string; label: string }>
  }
>

const legacyStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
] as const

export function resolveKnowledgeKindConfig(kind: string) {
  if (kind in knowledgeKindConfig) {
    return knowledgeKindConfig[kind as InsightKind]
  }

  return {
    label: 'Legacy record',
    shortLabel: 'Record',
    icon: Radio,
    statuses: legacyStatusOptions,
  }
}
