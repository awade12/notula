import { cn } from '@/lib/cn'
import { spaceAccentColor, spaceInitial } from '../../lib/space-accent'

type SpaceAvatarProps = {
  name: string
  className?: string
}

export function SpaceAvatar({ name, className }: SpaceAvatarProps) {
  const color = spaceAccentColor(name)
  const initial = spaceInitial(name)

  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-md',
        'text-meta font-medium leading-none text-white',
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initial}
    </span>
  )
}
