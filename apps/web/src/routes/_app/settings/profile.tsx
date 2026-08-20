import { createFileRoute } from '@tanstack/react-router'
import { ProfileSettingsForm } from '@/features/settings/components/profile-settings-form'

export const Route = createFileRoute('/_app/settings/profile')({
  component: ProfileSettingsPage,
})

function ProfileSettingsPage() {
  return <ProfileSettingsForm />
}
