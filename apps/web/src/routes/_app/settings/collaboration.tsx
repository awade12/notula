import { createFileRoute } from '@tanstack/react-router'
import { CollaborationSettingsForm } from '@/features/settings/components/collaboration-settings-form'

export const Route = createFileRoute('/_app/settings/collaboration')({
  component: () => <CollaborationSettingsForm />,
})
