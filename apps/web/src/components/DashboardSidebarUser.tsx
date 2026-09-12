import { cn, useSquircleClip } from '@listeningkit/ui'

export type DashboardSidebarUserProps = {
  /** Display name shown in the card. Defaults to the guest fallback. */
  name?: string
  /** Plan label shown under the name. Defaults to the free plan. */
  plan?: string
  /** When true, renders as an avatar-only chip for the icon-rail state. */
  collapsed?: boolean
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'G'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function DashboardSidebarUser({
  name = 'Guest User',
  plan = 'Free plan',
  collapsed = false,
}: DashboardSidebarUserProps) {
  const clip = useSquircleClip<HTMLDivElement>(16)

  return (
    <div
      ref={clip.ref}
      style={clip.style}
      className={cn(
        'flex items-center justify-start overflow-hidden bg-[#FBFCFE] transition-[gap,padding] duration-300',
        collapsed ? 'gap-0 p-1.5' : 'gap-3 p-3'
      )}
    >
      <span
        title={name}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2A8CFF] text-sm font-bold text-white"
      >
        {initialsOf(name)}
      </span>
      {/* Stays mounted; collapses to zero width/opacity instead of truncating into a sliver. */}
      <span
        className={cn(
          'flex min-w-0 flex-1 flex-col text-left transition-[width,opacity] duration-300',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}
        aria-hidden={collapsed || undefined}
      >
        <span className="truncate text-sm font-bold text-text-primary">{name}</span>
        <span className="truncate text-xs text-text-secondary">{plan}</span>
      </span>
    </div>
  )
}
