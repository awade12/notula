import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const settingsFieldClass = cn(
  'w-full rounded-lg border border-border bg-sidebar px-3 py-2',
  'text-sm tracking-dashboard text-text-emphasis outline-none',
  'focus:border-white/20',
)

export const settingsLabelClass = 'mb-1.5 block text-meta tracking-dashboard text-text-primary'

type SettingsRowProps = {
  label: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center', className)}>
      <div className="min-w-0">
        <p className="text-sm tracking-dashboard text-text-emphasis">{label}</p>
        {description ? (
          <p className="mt-1 text-[11px] leading-relaxed tracking-dashboard text-text-primary/70">
            {description}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

type SettingsSelectProps = {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}

export function SettingsSelect({ value, onChange, options, disabled }: SettingsSelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(settingsFieldClass, disabled && 'cursor-not-allowed opacity-60')}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function SettingsBetaBadge() {
  return (
    <span className="inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-primary/80 ring-1 ring-inset ring-white/10 bg-white/5">
      Beta
    </span>
  )
}

type SettingsToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  badge?: ReactNode
}

export function SettingsToggle({ checked, onChange, label, description, badge }: SettingsToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border/70 bg-sidebar/30 px-3 py-3">
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 text-sm tracking-dashboard text-text-emphasis">
          <span>{label}</span>
          {badge}
        </span>
        {description ? (
          <span className="mt-1 block text-[11px] leading-relaxed tracking-dashboard text-text-primary/70">
            {description}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-white"
      />
    </label>
  )
}

type SettingsSliderProps = {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

export function SettingsSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}: SettingsSliderProps) {
  return (
    <div className="space-y-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-white"
      />
      <p className="text-[11px] tracking-dashboard text-text-primary/70">
        {formatValue ? formatValue(value) : value}
      </p>
    </div>
  )
}

type SettingsChoiceGridProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; preview?: ReactNode }>
  columns?: 2 | 3 | 4
}

export function SettingsChoiceGrid<T extends string>({
  value,
  onChange,
  options,
  columns = 3,
}: SettingsChoiceGridProps<T>) {
  const gridClass =
    columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'

  return (
    <div className={cn('grid gap-2', gridClass)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-left transition-colors',
              selected
                ? 'border-white/20 bg-white/10 text-text-emphasis'
                : 'border-border bg-sidebar/30 text-text-primary hover:border-white/10 hover:bg-white/5',
            )}
          >
            {option.preview}
            <span className="block text-xs tracking-dashboard">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

type SettingsFontPreviewProps = {
  family: string
  label: string
  sample?: string
}

export function SettingsFontPreview({
  family,
  label,
  sample = 'The quick brown fox jumps over the lazy dog.',
}: SettingsFontPreviewProps) {
  return (
    <div className="rounded-lg border border-border bg-sidebar/50 p-4">
      <p className="text-[10px] uppercase tracking-wider text-text-primary/60">{label}</p>
      <p
        className="mt-2 text-lg text-text-emphasis"
        style={{ fontFamily: family }}
      >
        {sample}
      </p>
      <p
        className="mt-1 text-sm text-text-primary"
        style={{ fontFamily: family }}
      >
        Aa Bb Cc 123 — editor preview
      </p>
    </div>
  )
}

export function SettingsResetBar({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-border/80 bg-sidebar/20 px-4 py-3">
      <div>
        <p className="text-sm tracking-dashboard text-text-emphasis">Reset to defaults</p>
        <p className="mt-0.5 text-[11px] tracking-dashboard text-text-primary/70">
          Restore all appearance settings to their original values.
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className={cn(
          'shrink-0 rounded-lg border border-border px-3 py-2 text-xs tracking-dashboard',
          'text-text-primary transition-colors hover:bg-white/5 hover:text-text-emphasis',
        )}
      >
        Reset
      </button>
    </div>
  )
}
