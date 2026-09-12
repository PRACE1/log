import { useEffect, useState } from 'react'
import { Button, useSquircleClip, useToast } from '@listeningkit/ui'
import {
  barkPushUrl,
  loadBarkConfig,
  saveBarkConfig,
  sendBarkPush,
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

export function DashboardSettingsNotifications() {
  const clip = useSquircleClip<HTMLDivElement>(20)
  const iconClip = useSquircleClip<HTMLSpanElement>(10)
  const [open, setOpen] = useState(true)
  const [server, setServer] = useState(() => loadBarkConfig().server)
  const [deviceKey, setDeviceKey] = useState(() => loadBarkConfig().deviceKey)
  const [status, setStatus] = useState<SendStatus>('idle')
  const busy = status === 'sending'
  const { error: notifyError, success: notifySuccess } = useToast()
  const testUrl = deviceKey.trim() ? barkPushUrlSafe(server, deviceKey) : null

  // Effect-driven send: the button arms 'sending', the effect pushes via Bark.
  // Hard rule: error messaging always goes through toasts — never render
  // error text inline in dashboard components.
  useEffect(() => {
    if (status !== 'sending') return
    let cancelled = false
    sendBarkPush({
      server,
      deviceKey,
      title: 'ListeningKit',
      body: 'Test notification — your Bark is wired up.',
    })
      .then(() => {
        if (cancelled) return
        saveBarkConfig({ server, deviceKey })
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
  }, [status, server, deviceKey, notifyError, notifySuccess])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Push to your phone</h2>
        <p className="text-sm text-text-secondary">
          Bark pings your iPhone the moment a signal lands. Paste your server and device key, then send a test.
        </p>
      </div>
      <div ref={clip.ref} style={clip.style} className="bg-white">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <span ref={iconClip.ref} style={iconClip.style} className="flex size-10 shrink-0 items-center justify-center bg-[#2A8CFF]">
            <img src="/icons/bark.svg" alt="Bark" className="size-6 shrink-0" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-bold text-text-primary">Bark push</span>
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
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Bark server</span>
              <input
                type="text"
                value={server}
                onChange={(e) => {
                  setServer(e.target.value)
                  setStatus('idle')
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
                  setDeviceKey(e.target.value)
                  setStatus('idle')
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
              {testUrl && (
                <a
                  href={testUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[#2A8CFF] underline decoration-dashed underline-offset-4"
                >
                  or open the test push URL directly
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function barkPushUrlSafe(server: string, deviceKey: string): string | null {
  try {
    return barkPushUrl({ server, deviceKey, title: 'ListeningKit', body: 'Test notification.' })
  } catch {
    return null
  }
}
