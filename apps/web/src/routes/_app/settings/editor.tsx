import { createFileRoute } from '@tanstack/react-router'
import { EditorSettingsForm } from '@/features/settings/components/editor-settings-form'

export const Route = createFileRoute('/_app/settings/editor')({
  component: EditorSettingsRoute,
})

function EditorSettingsRoute() {
  return <EditorSettingsForm />
}
