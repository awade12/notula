import { cn } from '@/lib/cn'

type AiPromptInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

export function AiPromptInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Ask anything about this page…',
}: AiPromptInputProps) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      rows={4}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          onSubmit()
        }
      }}
      className={cn(
        'w-full resize-none rounded-xl border border-border bg-sidebar px-3 py-2.5',
        'text-sm tracking-dashboard text-text-emphasis outline-none',
        'placeholder:text-text-primary/40 focus:border-white/20 disabled:opacity-40',
      )}
    />
  )
}
