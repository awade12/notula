import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { projectPanelFieldTrigger } from '../lib/project-panel-classes'

type ProjectTaskNumberFieldProps = {
  value: unknown
  readOnly?: boolean
  placeholder?: string
  suffix?: string
  onCommit: (value: number | null) => void
}

export function ProjectTaskNumberField({
  value,
  readOnly = false,
  placeholder = 'None',
  suffix,
  onCommit,
}: ProjectTaskNumberFieldProps) {
  const saved = typeof value === 'number' && Number.isFinite(value) ? value : null
  const [draft, setDraft] = useState(saved === null ? '' : String(saved))

  useEffect(() => {
    setDraft(saved === null ? '' : String(saved))
  }, [saved])

  function commit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      if (saved !== null) onCommit(null)
      return
    }
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
      setDraft(saved === null ? '' : String(saved))
      return
    }
    if (parsed !== saved) onCommit(parsed)
  }

  if (readOnly) {
    return (
      <div className={cn(projectPanelFieldTrigger, !saved && 'text-text-primary/40')}>
        {saved !== null ? (
          <span>
            {saved}
            {suffix ? ` ${suffix}` : ''}
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn(projectPanelFieldTrigger, 'gap-2')}>
      <input
        type="number"
        min={0}
        step={0.5}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
            ;(event.target as HTMLInputElement).blur()
          }
        }}
        className="min-w-0 flex-1 bg-transparent text-sm text-text-emphasis outline-none placeholder:text-text-primary/35"
      />
      {suffix ? <span className="shrink-0 text-xs text-text-primary/40">{suffix}</span> : null}
    </div>
  )
}
