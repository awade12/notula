import { createFileRoute } from '@tanstack/react-router'
import { LinksSettingsForm } from '@/features/settings/components/links-settings-form'

export const Route = createFileRoute('/_app/settings/links')({
  component: () => <LinksSettingsForm />,
})
