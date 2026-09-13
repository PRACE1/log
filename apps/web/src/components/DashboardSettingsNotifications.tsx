import { useEffect, useRef, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Button, useSquircleClip, useToast } from '@listeningkit/ui'
import {
  createBarkConnection,
  DEFAULT_BARK_LABEL,
  getBarkConnections,
  saveBarkConnection,
  sendBarkPush,
  type BarkConnection,
} from '@/lib/notifications/bark'

type SendStatus = 'idle' | 'sending' | 'sent' | 'error'

const PILL: Record<SendStatus, string> = {
  idle: 'bg-black/5 text-text-secondary',
  sending: 'animate-pulse bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-600',
}

const PILL_LABEL: Record<SendStatus, string> = {
  idle: 'Not tested',
  sending: 'Sending…',
  sent: 'Push sent',
  error: 'Failed',
}

function BarkConnectionRow({
  connection,
  open,
  onToggle,
  onAdd,
  onSaved,
  server,
  deviceKey,
  onServerChange,
  onKeyChange,
}: {
  connection: BarkConnection
  open: boolean
  onToggle: () => void
  /** Insert a duplicate of this connection directly below it. */
  onAdd: () => void
  /** Called after a successful send so the parent reconciles with the store. */
  onSaved: () => void
  server: string
  deviceKey: string
  onServerChange: (value: string) => void
  onKeyChange: (value: string) => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  const iconClip = useSquircleClip<HTMLSpanElement>(10)
  const [status, setStatus] = useState<SendStatus>('idle')
  const [label, setLabel] = useState(connection.label)
  const busy = status === 'sending'
  const { error: notifyError, success: notifySuccess } = useToast()

  // Keep the draft in step with the saved label (e.g. after a rename elsewhere).
  useEffect(() => {
    setLabel(connection.label)
  }, [connection.label])

  // Effect-driven send: the button arms the send, the effect pushes via Bark.
  // Hard rule: error messaging always goes through toasts — never render
  // error text inline in dashboard components.
  useEffect(() => {
    if (status !== 'sending') return
    let cancelled = false
    sendBarkPush({ server, deviceKey, title: 'ListeningKit', body: 'Test notification — your Bark is wired up.' })
      .then(() => {
        if (cancelled) return
        saveBarkConnection({ ...connection, server, deviceKey })
        setStatus('sent')
        notifySuccess('Push sent', 'Your iPhone should have buzzed.')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        notifyError('Push failed', err instanceof Error ? err.message : 'Could not send.')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
    // Only re-fire when the user arms the send; server/key are captured at press time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Renames commit on blur or Enter; an empty name falls back to the default label.
  async function saveName() {
    const trimmed = label.trim()
    const fallback = DEFAULT_BARK_LABEL
    if (!trimmed) {
      setLabel(fallback)
      return
    }
    if (trimmed === connection.label) return
    try {
      await saveBarkConnection({ ...connection, label: trimmed })
      onSaved()
    } catch (err: unknown) {
      notifyError('Rename failed', err instanceof Error ? err.message : 'Could not rename the connection.')
      setLabel(connection.label)
    }
  }

  const row = (
    <div ref={clip.ref} style={clip.style} className="bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <span ref={iconClip.ref} style={iconClip.style} className="flex size-10 shrink-0 items-center justify-center bg-[#2A8CFF]">
          <img src="/icons/bark.svg" alt="Bark" className="size-6 shrink-0" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold text-text-primary">{label}</span>
          <span className="truncate text-sm text-text-secondary">
            {status === 'sent' ? 'Test push delivered' : 'Paste your server and key'}
          </span>
        </span>
        {status !== 'error' && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${PILL[status]}`}>
            {PILL_LABEL[status]}
          </span>
        )}
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
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Connection name</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              disabled={busy}
              placeholder={DEFAULT_BARK_LABEL}
              autoComplete="off"
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#2a8cff] focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Bark server</span>
            <input
              type="text"
              value={server}
              onChange={(e) => {
                onServerChange(e.target.value)
                setStatus((s) => (s === 'sent' || s === 'error' ? 'idle' : s))
              }}
              disabled={busy}
              placeholder="https://api.day.app"
              autoComplete="off"
              spellCheck={false}
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#2a8cff] focus:outline-none disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Device key</span>
            <input
              type="password"
              value={deviceKey}
              onChange={(e) => {
                onKeyChange(e.target.value)
                setStatus((s) => (s === 'sent' || s === 'error' ? 'idle' : s))
              }}
              disabled={busy}
              placeholder="Paste your Bark device key"
              autoComplete="off"
              className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#2a8cff] focus:outline-none disabled:opacity-60"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="blue"
              size="lg"
              shadow="hard"
              disabled={busy}
              onClick={() => setStatus('sending')}
              className="font-bold text-white"
            >
              {busy ? 'Sending…' : status === 'sent' ? 'Send again' : status === 'error' ? 'Retry' : 'Send test push'}
            </Button>
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 text-sm font-medium text-text-secondary hover:border-[#2a8cff] hover:text-[#2a8cff]"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Add another connection
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return row
}

export function DashboardSettingsNotifications() {
  const [connections, setConnections] = useState<BarkConnection[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [serverById, setServerById] = useState<Record<string, string>>({})
  const [keyById, setKeyById] = useState<Record<string, string>>({})

  // Fetch the connection list on mount; the first row starts expanded.
  // First visit seeds an empty row so the panel is actionable immediately
  // (legacy single config, if any, already lands here via readList).
  // One-shot: StrictMode double-invokes the effect in dev, and a second
  // createBarkConnection would seed a duplicate empty row.
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    getBarkConnections()
      .then(async (list) => {
        const rows = list.length > 0 ? list : [await createBarkConnection()]
        setConnections(rows)
        setOpenId((v) => v ?? rows[0]?.id ?? null)
      })
      .catch(() => setConnections([]))
  }, [])

  function setServer(id: string, value: string) {
    setServerById((prev) => ({ ...prev, [id]: value }))
  }

  function setKey(id: string, value: string) {
    setKeyById((prev) => ({ ...prev, [id]: value }))
  }

  async function addConnection() {
    const created = await createBarkConnection()
    setConnections((prev) => [...(prev ?? []), created])
    setOpenId(created.id)
  }

  async function addConnectionAfter(sourceId: string) {
    const created = await createBarkConnection()
    setConnections((prev) => {
      const base = prev ?? []
      const idx = base.findIndex((c) => c.id === sourceId)
      const next = [...base]
      next.splice(idx === -1 ? next.length : idx + 1, 0, created)
      return next
    })
    // New connection starts as a copy of the one it was duplicated from.
    setServerById((prev) => ({ ...prev, [created.id]: prev[sourceId] ?? '' }))
    setKeyById((prev) => ({ ...prev, [created.id]: prev[sourceId] ?? '' }))
    setOpenId(created.id)
  }

  function reconcile() {
    getBarkConnections()
      .then((list) => {
        setConnections(list)
        const ids = new Set(list.map((c) => c.id))
        setServerById((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))))
        setKeyById((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id))))
      })
      .catch(() => undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Push to your phone</h2>
        <p className="text-sm text-text-secondary">
          Bark pings your iPhone the moment a signal lands. Paste your server and device key, then send a test.
        </p>
      </div>
      {(connections ?? []).map((connection) => (
        <BarkConnectionRow
          key={connection.id}
          connection={connection}
          open={openId === connection.id}
          onToggle={() => setOpenId((v) => (v === connection.id ? null : connection.id))}
          onAdd={() => addConnectionAfter(connection.id)}
          onSaved={() => reconcile()}
          server={serverById[connection.id] ?? ''}
          deviceKey={keyById[connection.id] ?? ''}
          onServerChange={(value) => setServer(connection.id, value)}
          onKeyChange={(value) => setKey(connection.id, value)}
        />
      ))}
      {connections === null && (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          Loading connections…
        </p>
      )}
      {connections !== null && connections.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-text-secondary">No Bark connections yet. Add one to start getting push alerts.</p>
          <button
            type="button"
            onClick={addConnection}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 text-sm font-medium text-text-secondary hover:border-[#2a8cff] hover:text-[#2a8cff]"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            Add a connection
          </button>
        </div>
      )}
    </div>
  )
}