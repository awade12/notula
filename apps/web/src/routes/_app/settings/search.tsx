import { createFileRoute } from '@tanstack/react-router'
import { SearchSettingsForm } from '@/features/settings/components/search-settings-form'

export const Route = createFileRoute('/_app/settings/search')({
  component: () => <SearchSettingsForm />,
})
