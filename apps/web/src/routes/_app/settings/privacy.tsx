import { createFileRoute } from '@tanstack/react-router'
import { PrivacySettingsForm } from '@/features/settings/components/privacy-settings-form'

export const Route = createFileRoute('/_app/settings/privacy')({
  component: () => <PrivacySettingsForm />,
})
