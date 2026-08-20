import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { DatabaseSchema, SelectOption } from '@notesapp/shared'
import { useUpdateDatabaseSchema } from '@/features/database/hooks/use-schema-actions'
import { selectOptionClassName } from '@/features/database/lib/select-option-styles'
import { cn } from '@/lib/cn'

const OPTION_COLORS = ['gray', 'blue', 'green', 'yellow', 'red', 'purple'] as const

type ProjectBoardSelectOptionSettingsProps = {
  spaceId: string
  boardId: string
  schema: DatabaseSchema
  propertyId: string
  emptyMessage: string
  description: string
  addLabel: string
  placeholder: string
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

export function ProjectBoardSelectOptionSettings({
  spaceId,
  boardId,
  schema,
  propertyId,
  emptyMessage,
  description,
  addLabel,
  placeholder,
  readOnly = false,
}: ProjectBoardSelectOptionSettingsProps) {
  const updateSchema = useUpdateDatabaseSchema(spaceId, boardId)
  const property = schema.properties.find((item) => item.id === propertyId)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftColor, setDraftColor] = useState<(typeof OPTION_COLORS)[number]>('blue')

  const options = useMemo(
    () =>
      property?.type === 'select' || property?.type === 'multi_select'
        ? (property.config?.options ?? [])
        : [],
    [property],
  )

  if (!property || (property.type !== 'select' && property.type !== 'multi_select')) {
    return <p className="text-sm text-text-primary/45">{emptyMessage}</p>
  }

  async function saveOptions(nextOptions: SelectOption[]) {
    const nextSchema: DatabaseSchema = {
      properties: schema.properties.map((item) =>
        item.id === propertyId
          ? { ...item, config: { ...item.config, options: nextOptions } }
          : item,
      ),
    }
    await updateSchema.mutateAsync(nextSchema)
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
      {description ? (
        <p className="text-sm tracking-dashboard text-text-primary/55">{description}</p>
      ) : null}

      <ul className="space-y-2">
        {options.map((option) => (
          <li
            key={option.id}
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2"
          >
            <span className={cn('rounded px-2 py-0.5 text-xs', selectOptionClassName(option.color))}>
              {option.label}
            </span>
            {!readOnly ? (
              <button
                type="button"
                disabled={updateSchema.isPending}
                onClick={() => void saveOptions(options.filter((item) => item.id !== option.id))}
                className="ml-auto rounded-md p-1 text-text-primary/40 transition-colors hover:bg-white/[0.05] hover:text-red-300/80 disabled:opacity-50"
                aria-label={`Remove ${option.label}`}
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {!readOnly ? (
        <form
          onSubmit={(event) => void handleAddOption(event)}
          className="space-y-3 rounded-lg border border-border/50 p-3"
        >
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-text-primary/40">
              {addLabel}
            </label>
            <input
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              placeholder={placeholder}
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
            {updateSchema.isPending ? 'Saving…' : `Add ${addLabel.toLowerCase()}`}
          </button>
        </form>
      ) : null}
    </div>
  )
}
