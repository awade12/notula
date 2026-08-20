import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function SearchInput({ value, onChange, inputRef }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <Search className="size-4 shrink-0 text-text-primary/40" strokeWidth={1.5} />
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search pages…"
        className={cn(
          'min-w-0 flex-1 bg-transparent text-sm tracking-dashboard text-text-primary',
          'placeholder:text-text-primary/40 outline-none',
        )}
      />
    </div>
  )
}
