import { createFileRoute } from '@tanstack/react-router'
import { AppearanceSettingsForm } from '@/features/settings/components/appearance-settings-form'

export const Route = createFileRoute('/_app/settings/appearance')({
  component: AppearanceSettingsRoute,
})

function AppearanceSettingsRoute() {
  return <AppearanceSettingsForm />
}
