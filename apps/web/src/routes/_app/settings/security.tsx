import { createFileRoute } from '@tanstack/react-router'
import { SecuritySettingsForm } from '@/features/settings/components/security-settings-form'

export const Route = createFileRoute('/_app/settings/security')({
  component: SecuritySettingsPage,
})

function SecuritySettingsPage() {
  return <SecuritySettingsForm />
}
