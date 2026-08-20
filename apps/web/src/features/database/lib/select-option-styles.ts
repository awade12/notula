import { cn } from '@/lib/cn'

export function selectOptionDotClassName(color?: string) {
  switch (color) {
    case 'blue':
      return 'bg-sky-400'
    case 'green':
      return 'bg-emerald-400'
    case 'red':
      return 'bg-red-400'
    case 'yellow':
      return 'bg-amber-400'
    case 'purple':
      return 'bg-violet-400'
    default:
      return 'bg-text-primary/35'
  }
}

export function selectOptionClassName(color?: string) {
  switch (color) {
    case 'blue':
      return cn('bg-sky-500/15 text-sky-200')
    case 'green':
      return cn('bg-emerald-500/15 text-emerald-200')
    case 'red':
      return cn('bg-red-500/15 text-red-200')
    case 'yellow':
      return cn('bg-amber-500/15 text-amber-200')
    case 'purple':
      return cn('bg-violet-500/15 text-violet-200')
    default:
      return cn('bg-white/[0.08] text-text-primary/75')
  }
}
