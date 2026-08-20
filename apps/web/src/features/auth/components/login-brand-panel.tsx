import { AppBrandMark } from '@/features/auth/components/app-brand-mark'
import { LoginAppPreview } from '@/features/auth/components/login-app-preview'
import { cn } from '@/lib/cn'

type LoginBrandPanelProps = {
  className?: string
}

export function LoginBrandPanel({ className }: LoginBrandPanelProps) {
  return (
    <div className={cn('flex h-full w-full flex-col gap-8 p-panel', className)}>
      <AppBrandMark align="start" size="lg" showDomain />
      <LoginAppPreview />
    </div>
  )
}
