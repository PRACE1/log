import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Badge, Button, useSquircleClip, useToast } from '@listeningkit/ui'
import { SOCIAL_ICONS, SocialGlyph } from '@/lib/social-icons'
import {
  addAccount,
  connectAccount,
  loadAccounts,
  removeAccount,
  testConnection,
  type ConnectionPlatform,
  type ConnectionRecord,
  type ConnectionStatus,
} from '@/lib/connections'

type SocialIcon = (typeof SOCIAL_ICONS)[number]

function iconFor(platform: ConnectionPlatform): SocialIcon {
  return SOCIAL_ICONS.find((icon) => icon.id === platform) ?? SOCIAL_ICONS[0]
}

function ConnectionRow({
  account,
  open,
  onToggle,
  onAdd,
  onConnected,
  onDeleted,
  cookie,
  proxy,
  onCookieChange,
  onProxyChange,
}: {
  account: ConnectionRecord
  open: boolean
  onToggle: () => void
  /** Insert a duplicate of this account directly below it. */
  onAdd: () => void
  /** Called after a successful connect so the parent reconciles with the store. */
  onConnected: () => void
  /** Called after delete so the parent reconciles with the store. */
  onDeleted: () => void
  cookie: string
  proxy: string
  onCookieChange: (value: string) => void
  onProxyChange: (value: string) => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  const icon = iconFor(account.platform)
  const [phase, setPhase] = useState<'connecting' | 'error' | null>(null)
  const [testing, setTesting] = useState(false)
  const { error: notifyError, success: notifySuccess } = useToast()

  const connected = account.connectedAt !== null
  const status: ConnectionStatus = connected
    ? 'connected'
    : phase === 'error'
      ? 'error'
      : phase === 'connecting'
        ? 'connecting'
        : 'idle'
  const busy = status === 'connecting'

  // Effect-driven connection: the button arms 'connecting', the effect dials the lib.
  // Hard rule: error messaging always goes through toasts — never render
  // error text inline in dashboard components.
  const { id, platform } = account
  useEffect(() => {
    if (status !== 'connecting') return
    let cancelled = false
    connectAccount({ id, platform, cookie, proxy })
      .then(() => {
        if (!cancelled) {
          setPhase(null)
          onConnected()
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          notifyError('Connection failed', err instanceof Error ? err.message : 'Could not connect.')
          setPhase('error')
        }
      })
    return () => {
      cancelled = true
    }
    // Only re-fire when the user arms the connect; cookie/proxy are captured at press time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  function remove() {
    removeAccount(account.id)
    setPhase(null)
    onDeleted()
  }

  async function runTest() {
    if (testing || busy) return
    setTesting(true)
    try {
      const res = await testConnection({ id: account.id, platform: account.platform, cookie, proxy })
      notifySuccess(
        'Test passed',
        res.viaProxy
          ? `${icon.label} connection looks good (via proxy).`
          : `${icon.label} connection looks good.`,
      )
    } catch (err: unknown) {
      notifyError('Test failed', err instanceof Error ? err.message : 'Test failed.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div ref={clip.ref} style={clip.style} className="bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <SocialGlyph icon={icon} className="size-8 shrink-0 text-[#2A8CFF]" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold text-text-primary">{account.label}</span>
          <span className="truncate text-sm text-text-secondary">
            {status === 'connected' ? 'Listening for signals' : 'Paste a cookie to connect'}
          </span>
        </span>
        {status !== 'error' &&
          (status === 'connected' ? (
            <Badge variant="success" dot>
              Connected
            </Badge>
          ) : status === 'connecting' ? (
            <Badge variant="warning" className="animate-pulse">
              Connecting…
            </Badge>
          ) : (
            <Badge variant="muted">Not connected</Badge>
          ))}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`size-4 shrink-0 text-text-secondary transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-black/5 p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              {icon.label} cookie
            </span>
            <input
              type="password"
              value={cookie}
              onChange={(e) => onCookieChange(e.target.value)}
              disabled={busy || status === 'connected'}
              placeholder={`Paste your ${icon.label} cookie`}
              autoComplete="off"
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#2a8cff] focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Proxy <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              type="text"
              value={proxy}
              onChange={(e) => onProxyChange(e.target.value)}
              disabled={busy || status === 'connected'}
              placeholder="http://user:pass@host:port"
              autoComplete="off"
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#2a8cff] focus:outline-none disabled:opacity-60"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {status === 'connected' ? (
              <>
                <Button type="button" variant="gray" size="lg" disabled={testing} onClick={runTest}>
                  {testing ? 'Testing…' : 'Test Connection'}
                </Button>
                <Button type="button" variant="destructive" size="lg" onClick={remove}>
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="blue"
                  size="lg"
                  shadow="hard"
                  disabled={busy || testing}
                  onClick={() => setPhase('connecting')}
                  className="font-bold text-white"
                >
                  {busy ? 'Connecting…' : status === 'error' ? 'Retry' : 'Connect'}
                </Button>
                <Button type="button" variant="gray" size="lg" disabled={busy || testing} onClick={runTest}>
                  {testing ? 'Testing…' : 'Test Connection'}
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 text-sm font-medium text-text-secondary hover:border-[#2a8cff] hover:text-[#2a8cff]"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Add another account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardSettingsConnections() {
  const [accounts, setAccounts] = useState<ConnectionRecord[]>(() => loadAccounts())
  const [openId, setOpenId] = useState<string | null>(null)
  const [cookieById, setCookieById] = useState<Record<string, string>>({})
  const [proxyById, setProxyById] = useState<Record<string, string>>({})

  function setCookie(id: string, value: string) {
    setCookieById((prev) => ({ ...prev, [id]: value }))
  }

  function setProxy(id: string, value: string) {
    setProxyById((prev) => ({ ...prev, [id]: value }))
  }

  function addAccountAfter(sourceId: string) {
    const source = accounts.find((a) => a.id === sourceId)
    if (!source) return
    const record = addAccount(source.platform)
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === sourceId)
      if (idx === -1) return loadAccounts()
      const next = [...prev]
      next.splice(idx + 1, 0, record)
      return next
    })
    // New account starts as a copy of the one it was duplicated from.
    setCookieById((prev) => ({ ...prev, [record.id]: prev[sourceId] ?? '' }))
    setProxyById((prev) => ({ ...prev, [record.id]: prev[sourceId] ?? '' }))
    setOpenId(record.id)
  }

  function reconcile(list: ConnectionRecord[] = loadAccounts()) {
    setAccounts(list)
    const ids = new Set(list.map((a) => a.id))
    setCookieById((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))))
    setProxyById((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))))
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Where we listen</h2>
        <p className="text-sm text-text-secondary">
          Connect each account with a cookie from the extension. Traffic can go through your proxy.
        </p>
      </div>
      {accounts.map((account) => (
        <ConnectionRow
          key={account.id}
          account={account}
          open={openId === account.id}
          onToggle={() => setOpenId((v) => (v === account.id ? null : account.id))}
          onAdd={() => addAccountAfter(account.id)}
          onConnected={() => reconcile()}
          onDeleted={() => reconcile()}
          cookie={cookieById[account.id] ?? ''}
          proxy={proxyById[account.id] ?? ''}
          onCookieChange={(value) => setCookie(account.id, value)}
          onProxyChange={(value) => setProxy(account.id, value)}
        />
      ))}
      {accounts.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          No accounts yet — add one in the Accounts tab.
        </p>
      )}
    </div>
  )
}