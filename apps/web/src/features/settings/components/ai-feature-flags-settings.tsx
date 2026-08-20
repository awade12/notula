import { SettingsBetaBadge, SettingsToggle } from '@/features/settings/components/settings-controls'
import { SettingsSection } from '@/features/settings/components/settings-section'
import { useUpdateAiSettings } from '@/features/settings/hooks/use-ai-settings'
import type { AiFeatureFlags } from '@/features/ai/lib/feature-flags'

type AiFeatureFlagsSettingsProps = {
  flags: AiFeatureFlags
}

const FLAG_ROWS: Array<{
  key: keyof AiFeatureFlags
  label: string
  description: string
}> = [
  {
    key: 'turnInto',
    label: 'Turn into…',
    description: 'One-click transforms: todos, meeting notes, PRD, retro, user story map.',
  },
  {
    key: 'continueWriting',
    label: 'Continue from cursor',
    description: 'Stream the next section in your voice using page context.',
  },
  {
    key: 'rewriteSelection',
    label: 'Rewrite selection',
    description: 'Shorter, clearer, formal, exec/engineer tone, grammar, expand bullets.',
  },
  {
    key: 'slashCommands',
    label: 'Slash AI commands',
    description: '/summarize, /action items, /questions, /decision with real block types.',
  },
  {
    key: 'stalePageDetector',
    label: 'Stale page detector',
    description: 'Warn when a heavily linked page has not been updated in 90+ days.',
  },
  {
    key: 'meetingPrep',
    label: 'Meeting prep',
    description: 'Surface linked notes, recent edits, and semantically related pages.',
  },
  {
    key: 'duplicateDetection',
    label: 'Duplicate detection',
    description: 'Suggest similar pages when embeddings are enabled.',
  },
  {
    key: 'inlineGhostCompletion',
    label: 'Inline ghost completion',
    description: 'Gray inline suggestion at your cursor while typing. Tab to accept, Esc to dismiss — local only until accepted.',
  },
]

export function AiFeatureFlagsSettings({ flags }: AiFeatureFlagsSettingsProps) {
  const updateSettings = useUpdateAiSettings()

  function setFlag(key: keyof AiFeatureFlags, value: boolean) {
    void updateSettings.mutateAsync({
      featureFlags: { [key]: value },
    })
  }

  return (
    <SettingsSection
      title="Editor AI features"
      description="Toggle each capability independently. Requires a saved OpenRouter key."
    >
      <div className="space-y-4">
        {FLAG_ROWS.map((row) => (
          <SettingsToggle
            key={row.key}
            checked={flags[row.key]}
            onChange={(value) => setFlag(row.key, value)}
            label={row.label}
            description={row.description}
            badge={<SettingsBetaBadge />}
          />
        ))}
      </div>
    </SettingsSection>
  )
}
