import { createFileRoute } from '@tanstack/react-router'
import { ShortcutsSettingsForm } from '@/features/settings/components/shortcuts-settings-form'

export const Route = createFileRoute('/_app/settings/shortcuts')({
  component: () => <ShortcutsSettingsForm />,
})
