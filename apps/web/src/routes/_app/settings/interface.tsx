import { createFileRoute } from '@tanstack/react-router'
import { InterfaceSettingsForm } from '@/features/settings/components/interface-settings-form'

export const Route = createFileRoute('/_app/settings/interface')({
  component: InterfaceSettingsRoute,
})

function InterfaceSettingsRoute() {
  return <InterfaceSettingsForm />
}
