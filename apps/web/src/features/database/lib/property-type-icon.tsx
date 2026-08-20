import {
  CheckSquare,
  Hash,
  Link2,
  List,
  Tags,
  Type,
  type LucideIcon,
} from 'lucide-react'
import type { PropertyDefinition } from '@notesapp/shared'
import { cn } from '@/lib/cn'

const icons: Record<PropertyDefinition['type'], LucideIcon> = {
  text: Type,
  number: Hash,
  checkbox: CheckSquare,
  select: List,
  multi_select: Tags,
  relation: Link2,
}

type PropertyTypeIconProps = {
  type: PropertyDefinition['type']
  className?: string
}

export function PropertyTypeIcon({ type, className }: PropertyTypeIconProps) {
  const Icon = icons[type]
  return <Icon className={cn('size-3.5 shrink-0 opacity-55', className)} strokeWidth={1.75} />
}
