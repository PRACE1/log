import { useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import { BellIcon, CreditCardIcon, LinkIcon } from '@heroicons/react/24/outline'
import { useSquircleClip } from '@listeningkit/ui'
import { DashboardSettingsConnections } from './DashboardSettingsConnections'
import { DashboardSettingsNotifications } from './DashboardSettingsNotifications'

type TabIcon = ComponentType<SVGProps<SVGSVGElement>>
type SettingsTabId = 'connections' | 'notifications'

function SettingsTab({
  label,
  active,
  Icon,
  onClick,
}: {
  label: string
  active: boolean
  Icon: TabIcon
  onClick?: () => void
}) {
  const clip = useSquircleClip<HTMLSpanElement>(9)

  const inner = (
    <>
      <span ref={clip.ref} style={clip.style} className={`flex size-7 items-center justify-center ${active ? 'bg-[#2A8CFF]' : 'bg-black/5'}`}>
        <Icon aria-hidden="true" className={`size-4 ${active ? 'text-white' : 'text-text-secondary'}`} />
      </span>
      {label}
      {!onClick && (
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold">Soon</span>
      )}
    </>
  )

  const className = `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold ${
    active ? 'bg-brand-600/10 text-brand-600' : 'text-text-secondary'
  }`

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={className}>
      {inner}
    </button>
  ) : (
    <span className={className}>{inner}</span>
  )
}

export function DashboardSettings() {
  const [tab, setTab] = useState<SettingsTabId>('connections')

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage how ListeningKit connects.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <SettingsTab label="Connections" active={tab === 'connections'} Icon={LinkIcon} onClick={() => setTab('connections')} />
        <SettingsTab label="Notifications" active={tab === 'notifications'} Icon={BellIcon} onClick={() => setTab('notifications')} />
        <SettingsTab label="Billing" active={false} Icon={CreditCardIcon} />
      </div>
      {tab === 'connections' ? <DashboardSettingsConnections /> : <DashboardSettingsNotifications />}
    </div>
  )
}
