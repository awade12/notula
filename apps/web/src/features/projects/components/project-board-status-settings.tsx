import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import type { DatabaseSchema, SelectOption } from '@notesapp/shared'
import { PROJECT_BOARD_PROPERTY_IDS } from '@notesapp/shared'
import { useUpdateDatabaseSchema } from '@/features/database/hooks/use-schema-actions'
import { useUpdateView } from '@/features/database/hooks/use-view-actions'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import type { DatabaseView } from '@/features/database/types'
import { cn } from '@/lib/cn'

const OPTION_COLORS = ['gray', 'blue', 'green', 'yellow', 'red', 'purple'] as const

type ProjectBoardStatusSettingsProps = {
  spaceId: string
  boardId: string
  schema: DatabaseSchema
  boardView: DatabaseView
  readOnly?: boolean
}

function slugifyOption(label: string) {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'option'
}

function uniqueOptionId(label: string, options: SelectOption[]) {
  const base = slugifyOption(label)
  if (!options.some((option) => option.id === base)) return base
  let index = 2
  while (options.some((option) => option.id === `${base}-${index}`)) {
    index += 1
  }
  return `${base}-${index}`
}

export function ProjectBoardStatusSettings({
  spaceId,
  boardId,
  schema,
  boardView,
  readOnly = false,
}: ProjectBoardStatusSettingsProps) {
  const updateSchema = useUpdateDatabaseSchema(spaceId, boardId)
  const updateView = useUpdateView(spaceId, boardId)
  const property = schema.properties.find((item) => item.id === PROJECT_BOARD_PROPERTY_IDS.status)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftColor, setDraftColor] = useState<(typeof OPTION_COLORS)[number]>('blue')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const options = useMemo(
    () => (property?.type === 'select' ? (property.config?.options ?? []) : []),
    [property],
  )

  const hiddenGroupIds = boardView.config.hiddenGroupIds ?? []

  if (!property || property.type !== 'select') {
    return (
      <p className="text-sm text-text-primary/45">
        Status columns are not available on this board yet. Reload the board to sync the latest
        schema.
      </p>
    )
  }

  async function saveOptions(nextOptions: SelectOption[]) {
    const nextSchema: DatabaseSchema = {
      properties: schema.properties.map((item) =>
        item.id === PROJECT_BOARD_PROPERTY_IDS.status
          ? { ...item, config: { ...item.config, options: nextOptions } }
          : item,
      ),
    }
    await updateSchema.mutateAsync(nextSchema)
  }

  async function toggleHidden(optionId: string) {
    const nextHidden = hiddenGroupIds.includes(optionId)
      ? hiddenGroupIds.filter((id) => id !== optionId)
      : [...hiddenGroupIds, optionId]

    await updateView.mutateAsync({
      viewId: boardView.id,
      config: { ...boardView.config, hiddenGroupIds: nextHidden },
    })
  }

  async function moveOption(optionId: string, direction: -1 | 1) {
    const index = options.findIndex((option) => option.id === optionId)
    if (index === -1) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= options.length) return

    const next = [...options]
    const current = next[index]
    const swap = next[targetIndex]
    if (!current || !swap) return
    next[index] = swap
    next[targetIndex] = current
    await saveOptions(next)
  }

  async function commitRename(optionId: string) {
    const label = editLabel.trim()
    if (!label) return
    await saveOptions(
      options.map((option) => (option.id === optionId ? { ...option, label } : option)),
    )
    setEditingId(null)
  }

  async function handleAddOption(event: React.FormEvent) {
    event.preventDefault()
    const label = draftLabel.trim()
    if (!label || readOnly) return

    await saveOptions([
      ...options,
      { id: uniqueOptionId(label, options), label, color: draftColor },
    ])
    setDraftLabel('')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm tracking-dashboard text-text-primary/55">
        Rename, reorder, or hide status columns on the board. Hidden columns keep their tasks — they
        just won&apos;t show as Kanban lanes.
      </p>

      <ul className="space-y-2">
        {options.map((option, index) => {
          const isHidden = hiddenGroupIds.includes(option.id)
          const isEditing = editingId === option.id

          return (
            <li
              key={option.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2"
            >
              {!readOnly ? (
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0 || updateSchema.isPending}
                    onClick={() => void moveOption(option.id, -1)}
                    className="rounded p-0.5 text-text-primary/35 hover:bg-white/[0.05] hover:text-text-primary disabled:opacity-30"
                    aria-label={`Move ${option.label} up`}
                  >
                    <ChevronUp className="size-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    disabled={index === options.length - 1 || updateSchema.isPending}
                    onClick={() => void moveOption(option.id, 1)}
                    className="rounded p-0.5 text-text-primary/35 hover:bg-white/[0.05] hover:text-text-primary disabled:opacity-30"
                    aria-label={`Move ${option.label} down`}
                  >
                    <ChevronDown className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              ) : null}

              {isEditing && !readOnly ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={(event) => setEditLabel(event.target.value)}
                  onBlur={() => void commitRename(option.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void commitRename(option.id)
                    if (event.key === 'Escape') setEditingId(null)
                  }}
                  className="min-w-[8rem] flex-1 rounded-md border border-border/50 bg-white/[0.02] px-2 py-1 text-sm text-text-emphasis outline-none focus:border-white/20"
                />
              ) : (
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (readOnly) return
                    setEditingId(option.id)
                    setEditLabel(option.label)
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-xs',
                    selectOptionClassName(option.color),
                    !readOnly && 'cursor-text',
                    isHidden && 'opacity-50',
                  )}
                >
                  {option.label}
                </button>
              )}

              {!readOnly ? (
                <>
                  <button
                    type="button"
                    disabled={updateView.isPending}
                    onClick={() => void toggleHidden(option.id)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-primary/50 transition-colors hover:bg-white/[0.05] hover:text-text-emphasis"
                  >
                    {isHidden ? (
                      <>
                        <EyeOff className="size-3.5" strokeWidth={1.75} />
                        Hidden
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" strokeWidth={1.75} />
                        Visible
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={updateSchema.isPending || options.length <= 1}
                    onClick={() => void saveOptions(options.filter((item) => item.id !== option.id))}
                    className="rounded-md p-1 text-text-primary/40 transition-colors hover:bg-white/[0.05] hover:text-red-300/80 disabled:opacity-30"
                    aria-label={`Remove ${option.label}`}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </>
              ) : null}
            </li>
          )
        })}
      </ul>

      {!readOnly ? (
        <form
          onSubmit={(event) => void handleAddOption(event)}
          className="space-y-3 rounded-lg border border-border/50 p-3"
        >
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-text-primary/40">
              New status column
            </label>
            <input
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              placeholder="e.g. In review, Blocked"
              className="w-full rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2 text-sm text-text-emphasis outline-none placeholder:text-text-primary/35 focus:border-white/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-text-primary/40">
              Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {OPTION_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDraftColor(color)}
                  className={cn(
                    'rounded px-2 py-1 text-[11px] capitalize',
                    selectOptionClassName(color),
                    draftColor === color && 'ring-1 ring-white/20',
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!draftLabel.trim() || updateSchema.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs tracking-dashboard text-text-emphasis transition-colors hover:bg-white/14 disabled:opacity-40"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            {updateSchema.isPending ? 'Saving…' : 'Add column'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
