import { createFileRoute } from '@tanstack/react-router'
import { AiSettingsForm } from '@/features/settings/components/ai-settings-form'

export const Route = createFileRoute('/_app/settings/ai')({
  component: () => <AiSettingsForm />,
})
