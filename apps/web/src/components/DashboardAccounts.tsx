import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Globe, Plus } from 'lucide-react'
import {
  Badge,
  Button,
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
  addAccount,
  disconnectAccount,
  loadAccounts,
  platformLabel,
  type ConnectionPlatform,
  type ConnectionRecord
} from '../lib/connections'
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

export function DashboardAccounts() {
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: notifyError } = useToast()
  const [accounts, setAccounts] = useState<ConnectionRecord[]>(() => loadAccounts())
  const [filter, setFilter] = useState('all')

  // Pick up connections changed in the Settings tab when we come back to this page.
  useEffect(() => {
    setAccounts(loadAccounts())
  }, [location])

  const refresh = () => setAccounts(loadAccounts())

  const connectedCount = accounts.filter((a) => a.connectedAt !== null).length
  const rows = accounts.filter((account) => filter === 'all' || filter === account.platform)

  function handleDisconnect(account: ConnectionRecord) {
    try {
      disconnectAccount(account.id)
      refresh()
      success(`${account.label} disconnected`)
    } catch (err: unknown) {
      notifyError('Disconnect failed', err instanceof Error ? err.message : 'Could not disconnect.')
    }
  }

  function handleAddAccount(platform: ConnectionPlatform) {
    try {
      const record = addAccount(platform)
      setAccounts((prev) => [...prev, record])
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
            Social accounts and proxies ListeningKit reads from.
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
                const connected = account.connectedAt !== null
                return (
                  <TableRow key={account.id}>
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
                      {connected ? (
                        <Badge variant="success" dot>
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="muted">Not connected</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      {formatConnectedAt(account.connectedAt)}
                    </TableCell>
                    <TableCell>
                      {connected ? (
                        account.viaProxy ? (
                          <Badge variant="info">Via proxy</Badge>
                        ) : (
                          <Badge>Direct</Badge>
                        )
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {connected ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(account)}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="gray"
                          size="sm"
                          onClick={() => navigate('/dashboard/settings')}
                        >
                          <Plus aria-hidden="true" className="size-4" />
                          Connect
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </table>
        </Table>
      )}

      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          {accounts.length === 0
            ? 'No accounts yet — add one to start listening.'
            : `No ${filter === 'all' ? '' : platformLabel(filter as ConnectionPlatform) + ' '}accounts yet.`}
        </p>
      )}

      {connectedCount < accounts.length && (
        <p className="text-sm text-text-secondary">
          {connectedCount} of {accounts.length} accounts connected. Connect the rest in{' '}
          <button
            type="button"
            className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
            onClick={() => navigate('/dashboard/settings')}
          >
            Settings
          </button>
          .
        </p>
      )}
    </div>
  )
}