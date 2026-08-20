import { createFileRoute } from '@tanstack/react-router'
import { SettingsShell } from '@/features/settings/components/settings-shell'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsShell,
})
