import { createReactBlockSpec } from '@blocknote/react'
import { defaultProps } from '@blocknote/core'
import { useAllDatabases } from '@/features/database/hooks/use-rows'
import { DatabaseEmbedPreview } from '@/features/database/components/database-embed-preview'
import { useEditorWorkspace } from '@/features/editor/context/editor-workspace-context'
import { cn } from '@/lib/cn'

function DatabasePicker({
  databaseId,
  onSelect,
}: {
  databaseId: string
  onSelect: (nextDatabaseId: string) => void
}) {
  const { spaceId } = useEditorWorkspace()
  const { data: databases = [], isLoading } = useAllDatabases(spaceId)

  if (isLoading) {
    return <p className="px-3 py-4 text-sm text-text-primary/50">Loading databases…</p>
  }

  if (databases.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-text-primary/50">
        No databases in this teamspace yet.
      </p>
    )
  }

  return (
    <div className="max-h-56 overflow-y-auto p-1">
      {databases.map((database) => (
        <button
          key={database.id}
          type="button"
          onClick={() => onSelect(database.id)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
            databaseId === database.id
              ? 'bg-white/[0.06] text-text-emphasis'
              : 'text-text-primary/70 hover:bg-white/[0.04] hover:text-text-emphasis',
          )}
        >
          {database.icon ? <span>{database.icon}</span> : null}
          <span className="truncate">{database.title}</span>
        </button>
      ))}
    </div>
  )
}

export const databaseViewBlockSpec = createReactBlockSpec(
  {
    type: 'databaseView',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      databaseId: { default: '' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const { spaceId } = useEditorWorkspace()
      const databaseId = props.block.props.databaseId

      if (!databaseId) {
        return (
          <div className="notes-database-embed-picker rounded-xl border border-border bg-white/[0.015]" contentEditable={false}>
            <div className="border-b border-border px-3 py-2 text-sm font-medium text-text-emphasis">
              Embed database
            </div>
            <DatabasePicker
              databaseId={databaseId}
              onSelect={(nextDatabaseId) => {
                props.editor.updateBlock(props.block, {
                  props: { databaseId: nextDatabaseId },
                })
              }}
            />
          </div>
        )
      }

      return <DatabaseEmbedPreview spaceId={spaceId} databaseId={databaseId} compact />
    },
  },
)
