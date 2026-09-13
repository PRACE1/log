import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@listeningkit/ui'
import { getAccounts, platformLabel, type ConnectionRecord } from '../lib/connections'
import { getCommunities } from '../lib/communities'
import { getKeywords } from '../lib/keywords'
import {
  accountIssueSnapshot,
  effectiveSeverity,
  type AccountIssueEvent,
  type IssueSeverity
} from '../lib/account-issues'
import { SOCIAL_ICONS, SocialGlyph } from '../lib/social-icons'
import { DashboardAccountConsole } from './DashboardAccountConsole'
import { DashboardAccountInspectForm } from './DashboardAccountInspectForm'
import { useDashboardFormSlot } from './DashboardFormSlot'

const SEVERITY_BADGE: Record<IssueSeverity, 'success' | 'warning' | 'danger'> = {
  healthy: 'success',
  degraded: 'warning',
  unhealthy: 'danger'
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Header meta row: platform badge with its logo, the status badge (the
 * normalized issue when one is observed, else the lifecycle state), the
 * routing badge, and the last-check timestamp. The account id stays in the
 * route — it never renders as a cryptic fragment here.
 */
function AccountMeta({ account }: { account: ConnectionRecord }) {
  const platformIcon = SOCIAL_ICONS.find((icon) => icon.id === account.platform)
  const snapshot = accountIssueSnapshot(account)
  const severity = effectiveSeverity(snapshot)
  const issue = snapshot.issue
  const statusLabel = issue
    ? issue.label
    : severity === 'healthy'
      ? 'Connected'
      : severity === 'degraded'
        ? 'Stale'
        : 'Not connected'

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      {platformIcon ? (
        <Badge
          variant="brand"
          title={platformLabel(account.platform)}
          icon={<SocialGlyph icon={platformIcon} className="size-3.5" />}
        >
          {platformLabel(account.platform)}
        </Badge>
      ) : null}
      <Badge
        variant={SEVERITY_BADGE[severity]}
        dot={severity !== 'unhealthy'}
        title={issue ? issue.detail : snapshot.health.reason}
      >
        {statusLabel}
      </Badge>
      {account.connectedAt ? (
        <Badge variant={account.viaProxy ? 'info' : 'neutral'}>
          {account.viaProxy ? 'Via proxy' : 'Direct'}
        </Badge>
      ) : null}
      {account.lastCheckedAt ? (
        <span className="text-xs text-text-secondary">checked {formatTime(account.lastCheckedAt)}</span>
      ) : null}
    </div>
  )
}

/**
 * Per-account view, keyed by the account id in the route
 * (`/dashboard/accounts/:accountId`) — the same pattern as the per-keyword
 * analytics page. Row one is the full account-state console; the badge in
 * the Accounts table row leads directly here.
 */
export function DashboardAccountPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const setFormSlot = useDashboardFormSlot()
  const [account, setAccount] = useState<ConnectionRecord | null | undefined>(undefined)
  const [coverage, setCoverage] = useState<{ groups: number; keywords: number } | null>(null)
  const [inspected, setInspected] = useState<AccountIssueEvent | null>(null)

  useEffect(() => {
    let cancelled = false
    getAccounts()
      .then((list) => {
        if (!cancelled) setAccount(list.find((row) => row.id === accountId) ?? null)
      })
      .catch(() => {
        if (!cancelled) setAccount(null)
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  // Coverage this account runs: the groups it has joined (facebook joins are
  // attributed to the account; reddit joins are workspace-scoped, counted
  // for every account on the platform) and the keywords captured inside
  // those groups — plus the account's own group-less (X) keywords.
  useEffect(() => {
    if (!accountId) return
    let cancelled = false
    Promise.all([getCommunities(), getKeywords()])
      .then(([communities, keywords]) => {
        if (cancelled) return
        const tracked = communities.filter(
          (community) =>
            community.joinState !== 'none' &&
            (community.accountId === accountId || (community.accountId === null && community.platform === account?.platform))
        )
        const trackedIds = new Set(tracked.map((community) => community.id))
        const captured = keywords.filter((keyword) =>
          keyword.groupId !== null ? trackedIds.has(keyword.groupId) : keyword.platform === account?.platform
        )
        setCoverage({ groups: tracked.length, keywords: captured.length })
      })
      .catch(() => {
        if (!cancelled) setCoverage(null)
      })
    return () => {
      cancelled = true
    }
  }, [accountId, account?.platform])

  // The inspect form docks in the dashboard form slot — above the layout,
  // with the page underneath keeping its shape while it's open.
  useEffect(() => {
    setFormSlot(
      inspected && account
        ? (
            <DashboardAccountInspectForm
              account={account}
              event={inspected}
              onClose={() => setInspected(null)}
              onOpenSettings={() => navigate('/dashboard/settings')}
            />
          )
        : null
    )
    return () => setFormSlot(null)
  }, [inspected, account, setFormSlot, navigate])

  if (account === undefined) {
    return (
      <div className="flex flex-col gap-6 pb-6">
        <p className="rounded-xl bg-black/5 p-4 text-sm text-text-secondary" aria-busy="true">
          Loading account…
        </p>
      </div>
    )
  }

  if (account === null) {
    return (
      <div className="flex flex-col gap-6 pb-6">
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          That account doesn&apos;t exist in this workspace.{' '}
          <Link to="/dashboard/accounts" className="font-semibold text-[#2A8CFF] hover:underline">
            Back to accounts
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div>
        <Link
          to="/dashboard/accounts"
          className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2.25} aria-hidden="true" />
          Accounts
        </Link>
        <h1 className="mt-1 truncate text-3xl font-bold text-text-primary" title={account.label}>
          {account.label}
        </h1>
        <AccountMeta account={account} />
      </div>

      <DashboardAccountConsole record={account} onInspect={setInspected} stats={coverage} />
    </div>
  )
}