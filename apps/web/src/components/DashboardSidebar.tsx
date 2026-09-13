import type { ComponentType, MouseEvent, SVGProps } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  KeyIcon,
  Squares2X2Icon,
  TagIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { cn, useSquircleClip } from '@listeningkit/ui'
import { DashboardSidebarUser } from './DashboardSidebarUser'

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

const NAV: Array<{ label: string; Icon: NavIcon; to?: string }> = [
  { label: 'Overview', Icon: Squares2X2Icon, to: '/dashboard' },
  { label: 'Groups', Icon: UsersIcon, to: '/dashboard/groups' },
  { label: 'Listings', Icon: TagIcon, to: '/dashboard/facebook/listings' },
  { label: 'Keywords', Icon: KeyIcon, to: '/dashboard/keywords' },
  { label: 'Analytics', Icon: ChartBarIcon, to: '/dashboard/analytics' },
  { label: 'Accounts', Icon: UserCircleIcon, to: '/dashboard/accounts' },
  { label: 'Messages', Icon: ChatBubbleLeftRightIcon, to: '/dashboard/messages' },
  { label: 'Settings', Icon: Cog6ToothIcon, to: '/dashboard/settings' },
]

// Sliding indicator travel per nav row: h-12 (48px) item + 4px flex gap.
const ITEM_PITCH = 52

function NavItem({
  label,
  active,
  collapsed,
  Icon,
  to,
  onToggleCollapsed,
}: {
  label: string
  active: boolean
  collapsed: boolean
  Icon: NavIcon
  to?: string
  onToggleCollapsed: (collapsed: boolean) => void
}) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (active) {
      event.preventDefault()
      onToggleCollapsed(!collapsed)
    } else if (collapsed) {
      onToggleCollapsed(false)
    }
  }

  const className = cn(
    'relative flex h-12 w-full items-center overflow-hidden rounded-2xl py-2 pl-3 pr-3 text-sm font-semibold transition-[background-color,color,gap] duration-300',
    collapsed ? 'gap-0' : 'gap-3',
    active ? 'bg-brand-600/10 text-brand-600' : 'text-text-secondary hover:bg-black/[0.04]'
  )

  const inner = (
    <>
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#2A8CFF]' : 'bg-black/5'}`}
      >
        <Icon aria-hidden="true" className={`size-4 ${active ? 'text-white' : 'text-text-secondary'}`} />
      </span>
      {/* Label collapses to zero width/opacity instead of truncating into a sliver. */}
      <span
        className={cn(
          'min-w-0 truncate transition-[width,opacity,margin] duration-300',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}
        aria-hidden={collapsed || undefined}
      >
        {label}
      </span>
    </>
  )

  return to ? (
    <Link to={to} title={collapsed ? label : undefined} onClick={handleClick} className={className} aria-label={label}>
      {inner}
    </Link>
  ) : (
    <span title={collapsed ? label : undefined} className={className}>
      {inner}
    </span>
  )
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onToggleCollapsed: (collapsed: boolean) => void
}) {
  const sideClip = useSquircleClip<HTMLElement>(20, 1, { topRight: 20, bottomRight: 20 })
  const indicatorClip = useSquircleClip<HTMLSpanElement>(7, 1, { topLeft: 0, bottomLeft: 0 })
  const { pathname } = useLocation()
  const activeIndex = NAV.findIndex((item) => item.to === pathname)

  return (
    <aside
      ref={sideClip.ref}
      style={sideClip.style}
      className={cn(
        'm-4 ml-0 hidden shrink-0 flex-col gap-6 bg-white transition-[width,padding] duration-300 ease-in-out sm:flex',
        collapsed ? 'w-20 px-3 py-6' : 'w-64 p-6'
      )}
    >
      <Link
        to="/"
        aria-label="ListeningKit home"
        title="ListeningKit"
        className={cn(
          'flex items-center justify-start overflow-hidden text-left transition-[gap] duration-300',
          collapsed ? 'gap-0' : 'gap-3'
        )}
      >
        <img src="/logo.svg" alt="ListeningKit logo" className="size-11 shrink-0 rounded-[12px] object-contain" />
        <span
          className={cn(
            'flex min-w-0 flex-col gap-0.5 whitespace-nowrap transition-[width,opacity] duration-300',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}
          aria-hidden={collapsed || undefined}
        >
          <span className="truncate text-[17px] font-bold leading-tight text-text-primary">ListeningKit</span>
          <span className="truncate text-[13px] leading-snug text-text-secondary">Live social listening</span>
        </span>
      </Link>
      <nav className="flex min-h-0 flex-1 items-stretch">
        {/* Left indicator column — flush to the nav edge, no left padding. Collapses away
            in icon-only mode since the active pill background already shows state. */}
        <span
          className={cn(
            'relative shrink-0 overflow-hidden transition-[width,opacity] duration-300',
            collapsed ? 'w-0 opacity-0' : 'w-1.5 opacity-100'
          )}
          aria-hidden="true"
        >
          <span
            className="pointer-events-none absolute left-0 top-0 flex h-12 w-full items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `translateY(${activeIndex * ITEM_PITCH}px)` }}
          >
            <span ref={indicatorClip.ref} style={indicatorClip.style} className="block h-full w-1.5 bg-[#2A8CFF]" />
          </span>
          {NAV.map((item) => (
            <span key={item.label} className="block h-12 w-1.5" />
          ))}
        </span>
        <span className={cn('flex min-w-0 flex-1 flex-col gap-1 transition-[padding] duration-300', collapsed ? 'pl-0' : 'pl-2')}>
          {NAV.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              // Nested routes (e.g. /dashboard/analytics/:keywordId) keep
              // their section highlighted — except the index, which would
              // otherwise match every dashboard path as a prefix.
              active={
                item.to
                  ? pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(`${item.to}/`))
                  : false
              }
              collapsed={collapsed}
              Icon={item.Icon}
              to={item.to}
              onToggleCollapsed={onToggleCollapsed}
            />
          ))}
        </span>
      </nav>
      <DashboardSidebarUser collapsed={collapsed} />
    </aside>
  )
}
