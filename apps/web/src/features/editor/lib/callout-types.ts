import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type CalloutType = 'info' | 'warning' | 'success' | 'tip'

export type CalloutTypeConfig = {
  title: string
  value: CalloutType
  icon: LucideIcon
}

export const calloutTypes: CalloutTypeConfig[] = [
  { title: 'Info', value: 'info', icon: Info },
  { title: 'Warning', value: 'warning', icon: AlertTriangle },
  { title: 'Success', value: 'success', icon: CheckCircle2 },
  { title: 'Tip', value: 'tip', icon: Lightbulb },
]

export function getCalloutType(value: string): CalloutTypeConfig {
  return calloutTypes.find((type) => type.value === value) ?? calloutTypes[0]!
}
