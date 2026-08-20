import { WorkspaceIcon } from '@/features/workspace/components/workspace-icon'
import { appLogoIcon } from '@/features/workspace/lib/workspace-icon-pack'
import { iconSize } from '@/features/workspace/lib/workspace-icon-sizes'
import { appDomain, appName, appTagline } from '@/lib/app-brand'
import { cn } from '@/lib/cn'

type AppBrandMarkProps = {
  className?: string
  showTagline?: boolean
  showDomain?: boolean
  align?: 'center' | 'start'
  size?: 'md' | 'lg'
}

export function AppBrandMark({
  className,
  showTagline = true,
  showDomain = false,
  align = 'center',
  size = 'md',
}: AppBrandMarkProps) {
  const isLarge = size === 'lg'

  return (
    <div
      className={cn(
        'flex flex-col',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08]',
          isLarge ? 'size-14' : 'size-11',
        )}
      >
        <WorkspaceIcon
          icon={appLogoIcon}
          size={isLarge ? 24 : iconSize.brand}
          strokeWidth={1.75}
          className="text-text-emphasis"
        />
      </div>
      <p
        className={cn(
          'mt-4 font-medium tracking-dashboard text-text-emphasis',
          isLarge ? 'text-2xl' : 'text-xl',
        )}
      >
        {appName}
      </p>
      {showTagline ? (
        <p
          className={cn(
            'mt-2 tracking-dashboard text-text-primary',
            isLarge ? 'max-w-sm text-base' : 'max-w-xs text-sm',
          )}
        >
          {appTagline}
        </p>
      ) : null}
      {showDomain ? (
        <p className="mt-2 text-meta tracking-dashboard text-text-primary/60">{appDomain}</p>
      ) : null}
    </div>
  )
}
