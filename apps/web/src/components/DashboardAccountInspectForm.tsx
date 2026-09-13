import { TerminalSquare } from 'lucide-react'
import { platformLabel, type ConnectionRecord } from '../lib/connections'
import { ISSUE_CATALOG, type AccountIssueEvent, type RawSignal } from '../lib/account-issues'
import { SOCIAL_ICONS, SocialGlyph } from '../lib/social-icons'
import { DashboardFormSheet } from './DashboardFormSheet'

/** Fixes that are performed in ListeningKit's Settings tab (as opposed to in a browser). */
const SETTINGS_FIXES = new Set(['connect', 'reconnect', 'reexport_cookie', 'use_proxy'])

/** Flatten a raw signal into one readable trace line. */
function signalToText(signal: RawSignal): string {
  const parts: string[] = []
  if (signal.status != null) parts.push(`HTTP ${signal.status}`)
  if (signal.code != null) parts.push(`code ${signal.code}`)
  if (signal.subcode != null) parts.push(`subcode ${signal.subcode}`)
  if (signal.type) parts.push(signal.type)
  if (signal.marker) parts.push(JSON.stringify(signal.marker))
  if (signal.url) parts.push(signal.url)
  return parts.length ? parts.join(' · ') : 'no raw signal captured'
}

function formatTs(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * The inspect view for one observed issue on one account: what it is, what
 * happened, and the raw console log the client captured so the exact error
 * is visible. The Settings action is the confirm. Registered into the
 * dashboard form slot — it docks in the right column over the account page
 * without reflowing it.
 */
export function DashboardAccountInspectForm({
  account,
  event,
  onClose,
  onOpenSettings
}: {
  account: ConnectionRecord
  event: AccountIssueEvent
  onClose: () => void
  onOpenSettings: () => void
}) {
  const entry = ISSUE_CATALOG[event.issue]
  const showSettings = SETTINGS_FIXES.has(entry.fix)
  const platformIcon = SOCIAL_ICONS.find((icon) => icon.id === account.platform)

  return (
    <DashboardFormSheet
      open
      title={entry.label}
      subtitle={
        <>
          {platformIcon ? <SocialGlyph icon={platformIcon} className="size-4" /> : null}
          <span>{platformLabel(account.platform)}</span>
          <span>· observed {formatTs(event.ts)}</span>
        </>
      }
      onClose={onClose}
      confirmLabel={showSettings ? 'Open in Settings' : undefined}
      onConfirm={onOpenSettings}
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">What happened</p>
        <p className="text-sm leading-relaxed text-text-primary">{entry.detail[account.platform]}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="flex items-center gap-1.5 bg-black/[0.04] px-3 py-2">
          <TerminalSquare size={13} aria-hidden="true" className="text-text-secondary" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">Console log</span>
        </div>
        <div
          className="rounded-b-lg bg-white px-3 py-1 font-mono text-xs leading-relaxed text-text-primary"
          title={signalToText(event.signal)}
        >
          {signalToText(event.signal)}
        </div>
      </div>
    </DashboardFormSheet>
  )
}