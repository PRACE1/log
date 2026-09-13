import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Cable, Globe, Plus, Settings, Unplug } from 'lucide-react'
import {
  Badge,
  Dropdown,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast
} from '@listeningkit/ui'
import {
  createAccount,
  disconnectAccount,
  getAccounts,
  platformLabel,
  type ConnectionPlatform,
  type ConnectionRecord
} from '../lib/connections'
import {
  accountIssueSnapshot,
  effectiveSeverity,
  type IssueSeverity
} from '../lib/account-issues'
import { SocialBadge, SOCIAL_ICONS } from '../lib/social-icons'

const PLATFORMS: ConnectionPlatform[] = ['facebook', 'x', 'reddit']

function socialIconFor(platform: ConnectionPlatform) {
  return SOCIAL_ICONS.find((icon) => icon.id === platform)
}

function platformGlyph(platform: ConnectionPlatform) {
  const icon = socialIconFor(platform)
  return icon ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  ) : undefined
}

function formatConnectedAt(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SEVERITY_BADGE: Record<IssueSeverity, 'success' | 'warning' | 'danger'> = {
  healthy: 'success',
  degraded: 'warning',
  unhealthy: 'danger'
}

/**
 * The row's status badge: the active normalized issue wins when the client
 * has observed one ("Checkpoint challenge", "Rate limited"), falling back to
 * the lifecycle state ("Connected" / "Stale" / "Not connected").
 */
function StatusBadge({ account }: { account: ConnectionRecord }) {
  const snapshot = accountIssueSnapshot(account)
  const severity = effectiveSeverity(snapshot)
  const issue = snapshot.issue
  const label = issue
    ? issue.label
    : severity === 'healthy'
      ? 'Connected'
      : severity === 'degraded'
        ? 'Stale'
        : 'Not connected'
  const title = issue ? issue.detail : snapshot.health.reason
  return (
    <Badge variant={SEVERITY_BADGE[severity]} dot={severity !== 'unhealthy'} title={title}>
      {label}
    </Badge>
  )
}

export function DashboardAccounts() {
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: notifyError } = useToast()
  const [accounts, setAccounts] = useState<ConnectionRecord[] | null>(null)
  const [filter, setFilter] = useState('all')

  const load = () =>
    getAccounts().then(setAccounts).catch(() => setAccounts([]))

  // Fetch through the connections API on mount and whenever we come back
  // to this page (e.g. from the Settings tab after editing connections).
  useEffect(() => {
    load()
  }, [location])

  const rows = (accounts ?? []).filter((account) => filter === 'all' || filter === account.platform)

  async function handleDisconnect(account: ConnectionRecord) {
    try {
      setAccounts(await disconnectAccount(account.id))
      success(`${account.label} disconnected`)
    } catch (err: unknown) {
      notifyError('Disconnect failed', err instanceof Error ? err.message : 'Could not disconnect.')
    }
  }

  async function handleAddAccount(platform: ConnectionPlatform) {
    try {
      const record = await createAccount(platform)
      setAccounts((prev) => [...(prev ?? []), record])
      success(`${platformLabel(platform)} account added`)
      navigate('/dashboard/settings')
    } catch (err: unknown) {
      notifyError('Add account failed', err instanceof Error ? err.message : 'Could not add an account.')
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Accounts</h1>
          <p className="text-sm text-text-secondary">
            {accounts === null
              ? 'Loading accounts…'
              : 'Social accounts and proxies ListeningKit reads from. Click a row for its full state.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            matchWidth
            value={filter}
            onChange={setFilter}
            aria-label="Filter platforms"
            options={[
              { value: 'all', label: 'All platforms', icon: <Globe className="size-3.5" strokeWidth={2.25} /> },
              ...PLATFORMS.map((platform) => ({
                value: platform,
                label: platformLabel(platform),
                icon: platformGlyph(platform)
              }))
            ]}
          />
          <Select
            matchWidth
            value=""
            onChange={(value) => {
              if (value) handleAddAccount(value as ConnectionPlatform)
            }}
            aria-label="Add account"
            icon={<Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />}
            placeholder="Add account"
            options={PLATFORMS.map((platform) => ({
              value: platform,
              label: platformLabel(platform),
              icon: platformGlyph(platform)
            }))}
          />
        </div>
      </div>

      {rows.length > 0 && (
        <Table>
          <table className="w-full text-left">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connected</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((account) => {
                const icon = socialIconFor(account.platform)
                return (
                  <TableRow
                    key={account.id}
                    onClick={() => navigate(`/dashboard/accounts/${account.id}`)}
                    className="cursor-pointer hover:bg-black/[0.025]"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {icon ? (
                          <SocialBadge icon={icon} variant="blue" />
                        ) : (
                          <span className="size-8 rounded-full bg-black/5" aria-hidden="true" />
                        )}
                        <span className="font-semibold">{account.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge account={account} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      {formatConnectedAt(account.connectedAt)}
                    </TableCell>
                    <TableCell>
                      {account.connectedAt ? (
                        account.viaProxy ? (
                          <Badge variant="info">Via proxy</Badge>
                        ) : (
                          <Badge>Direct</Badge>
                        )
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Dropdown
                        aria-label={`${account.label} account actions`}
                        items={
                          account.connectedAt
                            ? [
                                {
                                  id: 'settings',
                                  label: 'Open in Settings',
                                  icon: <Settings aria-hidden="true" className="size-4" />,
                                  onSelect: () => navigate('/dashboard/settings')
                                },
                                {
                                  id: 'disconnect',
                                  label: 'Disconnect',
                                  icon: <Unplug aria-hidden="true" className="size-4" />,
                                  danger: true,
                                  onSelect: () => handleDisconnect(account)
                                }
                              ]
                            : [
                                {
                                  id: 'connect',
                                  label: 'Connect',
                                  icon: <Cable aria-hidden="true" className="size-4" />,
                                  onSelect: () => navigate('/dashboard/settings')
                                },
                                {
                                  id: 'settings',
                                  label: 'Open in Settings',
                                  icon: <Settings aria-hidden="true" className="size-4" />,
                                  onSelect: () => navigate('/dashboard/settings')
                                }
                              ]
                        }
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </table>
        </Table>
      )}

      {accounts !== null && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          {accounts.length === 0
            ? 'No accounts yet — add one to start listening.'
            : `No ${filter === 'all' ? '' : platformLabel(filter as ConnectionPlatform) + ' '}accounts yet.`}
        </p>
      )}

    </div>
  )
}