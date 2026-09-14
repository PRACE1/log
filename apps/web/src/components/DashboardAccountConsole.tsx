import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Activity, AlertTriangle, Globe, Hash, ShieldAlert, Users } from 'lucide-react'
import { Badge, useSquircleClip } from '@listeningkit/ui'
import { type ConnectionRecord } from '../lib/connections'
import {
  accountIssueSnapshot,
  effectiveSeverity,
  getAccountIssueEvents,
  ISSUE_CATALOG,
  type AccountIssueEvent,
  type IssueSeverity,
  type RawSignal
} from '../lib/account-issues'
import { DashboardTab, type DashboardTabAccent } from './DashboardTab'

/** The console never renders the whole history — it caps the list and says how much more the filter is hiding. */
const RENDER_CAP = 50

const SEVERITY_DOT: Record<IssueSeverity, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  unhealthy: 'bg-red-500'
}

const SEVERITY_BADGE: Record<IssueSeverity, 'success' | 'warning' | 'danger'> = {
  healthy: 'success',
  degraded: 'warning',
  unhealthy: 'danger'
}

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  unhealthy: 'Critical'
}

const FILTER_META: Record<'all' | 'degraded' | 'unhealthy', { label: string; icon: ReactNode; accent: DashboardTabAccent }> = {
  all: { label: 'All', icon: <Globe className="size-4" aria-hidden="true" />, accent: 'blue' },
  degraded: { label: 'Degraded', icon: <AlertTriangle className="size-4" aria-hidden="true" />, accent: 'amber' },
  unhealthy: { label: 'Critical', icon: <ShieldAlert className="size-4" aria-hidden="true" />, accent: 'red' }
}

interface FirehoseRowData {
  key: string
  label: string
  severity: IssueSeverity
  signal: string
  ts: string
  /** The highlighted, always-visible first row. */
  current: boolean
  /** False for the healthy "Connected" row — no issue to open. */
  inspectable: boolean
  event: AccountIssueEvent
}

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

/** Live countdown (seconds) for a transient issue, or null when not applicable. */
function useRetryRemaining(retryAfter: number | null | undefined, checkedAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now())

  const active = retryAfter != null && !!checkedAt
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])

  if (!active) return null
  const elapsed = Math.floor((now - new Date(checkedAt as string).getTime()) / 1000)
  return Math.max(0, (retryAfter as number) - elapsed)
}

/**
 * One line in the firehose, the same single-row grammar as the analytics
 * console: severity dot, label, severity badge, the raw signal the client
 * saw (truncated — full trace in the tooltip), timestamp. When inspectable,
 * the whole row opens the inspect form.
 */
function FirehoseRow({ row, onInspect }: { row: FirehoseRowData; onInspect: (event: AccountIssueEvent) => void }) {
  const { label, severity, signal, ts, current, inspectable, event } = row
  const inner = (
    <>
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${SEVERITY_DOT[severity]}`} />
      <span
        className={`max-w-[180px] shrink-0 truncate ${
          current ? 'text-sm font-bold text-text-primary' : 'text-sm font-semibold text-text-primary'
        }`}
        title={label}
      >
        {label}
      </span>
      <Badge variant={SEVERITY_BADGE[severity]} className="shrink-0">
        {SEVERITY_LABEL[severity]}
      </Badge>
      {current ? (
        <Badge variant="brand" className="shrink-0">
          Current
        </Badge>
      ) : null}
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary" title={signal}>
        {signal}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-text-secondary">{ts}</span>
    </>
  )
  const className = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
    current ? 'bg-black/[0.05] ring-1 ring-black/[0.06]' : 'bg-black/[0.02]'
  } ${inspectable ? 'cursor-pointer hover:bg-black/[0.05]' : ''}`

  return inspectable ? (
    <button type="button" onClick={() => onInspect(event)} title={`${label} — ${signal}`} className={className}>
      {inner}
    </button>
  ) : (
    <div className={className}>{inner}</div>
  )
}

/**
 * The full account-state firehose: everything this account has gone through,
 * newest first — the raw signal behind each normalized issue. Single rows,
 * same card shape as the analytics firehose. The account's current state is
 * the highlighted first row; clicking any row with an issue opens the
 * inspect form (registered in the dashboard form slot) with the full
 * write-up and next step for that issue.
 */
export function DashboardAccountConsole({
  record,
  onInspect,
  stats
}: {
  record: ConnectionRecord
  onInspect: (event: AccountIssueEvent) => void
  /** Coverage this account runs: groups it's in and keywords it captures. */
  stats?: { groups: number; keywords: number } | null
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  const [filter, setFilter] = useState<'all' | 'degraded' | 'unhealthy'>('all')

  const snapshot = accountIssueSnapshot(record)
  const severity = effectiveSeverity(snapshot)
  const issue = snapshot.issue

  const events = useMemo(() => getAccountIssueEvents(record), [record])

  // The current state, as its own first row. When an issue is active it is
  // the one the client last observed (click-through to inspect); otherwise
  // the row reads the lifecycle state ("Connected" / "Stale") and is not a
  // click target — there is no issue to open. The label matches the badge
  // the page header wears, so the two always agree.
const currentLabel = issue
    ? issue.label
    : severity === 'healthy'
      ? 'Connected'
      : severity === 'degraded'
        ? 'Stale'
        : 'Not connected'
  const currentEvent: AccountIssueEvent =
    events[0] ?? {
      id: `${record.id}-current`,
      ts: record.lastCheckedAt ?? record.connectedAt ?? new Date().toISOString(),
      issue: issue?.issue ?? 'never_connected',
      signal: record.rawSignal ?? {}
    }

  // History rows are the observed events behind the current one — the
  // current event itself is not repeated below itself.
  const history = events.slice(record.lastIssue ? 1 : 0)

  const rows: FirehoseRowData[] = [
    {
      // Own key: when there is no active issue the pinned row is a lifecycle
      // state, not a firehose event, and must not collide with events[0].id.
      key: `${record.id}-current`,
      label: currentLabel,
      severity,
      signal: issue ? signalToText(record.rawSignal ?? issue.signal) : 'no raw signal captured',
      ts: 'now',
      current: true,
      inspectable: issue !== null,
      event: currentEvent
    },
    ...history.map((event) => {
      const entry = ISSUE_CATALOG[event.issue]
      return {
        key: event.id,
        label: entry.label,
        severity: entry.severity,
        signal: signalToText(event.signal),
        ts: formatTs(event.ts),
        current: false,
        inspectable: true,
        event
      }
    })
  ]

  const scoped = rows.filter((row) => row.current || filter === 'all' || row.severity === filter)
  const visible = scoped.slice(0, RENDER_CAP)

  const remaining = useRetryRemaining(record.retryAfter, record.lastCheckedAt)
  const showRetry = issue?.transient && remaining != null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div ref={clip.ref} style={clip.style} className="bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2A8CFF] text-white"
            >
              <Activity className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Account firehose</h2>
              <p className="text-sm text-text-secondary">
                Everything this account has gone through — newest first.
              </p>
            </div>
          </div>
          {stats ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Coverage">
              <span className="flex items-center gap-1.5 text-sm">
                <Users className="size-3.5 text-text-secondary" aria-hidden="true" />
                <span className="font-semibold text-text-primary">{stats.groups}</span>
                <span className="text-text-secondary">{stats.groups === 1 ? 'group' : 'groups'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Hash className="size-3.5 text-text-secondary" aria-hidden="true" />
                <span className="font-semibold text-text-primary">{stats.keywords}</span>
                <span className="text-text-secondary">{stats.keywords === 1 ? 'keyword' : 'keywords'}</span>
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by severity">
            {(Object.keys(FILTER_META) as Array<keyof typeof FILTER_META>).map((option) => {
              const meta = FILTER_META[option]
              return (
                <DashboardTab
                  key={option}
                  active={filter === option}
                  onClick={() => setFilter(option)}
                  label={meta.label}
                  icon={meta.icon}
                  accent={meta.accent}
                />
              )
            })}
          </div>
        </div>

        <div className="lk-no-scrollbar mt-4 flex max-h-80 min-h-0 flex-col gap-2 overflow-y-auto">
          {visible.map((row) => (
            <FirehoseRow key={row.key} row={row} onInspect={onInspect} />
          ))}
        </div>

        {showRetry && remaining != null ? (
          <p className="mt-3 text-xs font-semibold text-amber-700">
            Safe to retry in {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')} —
            <span className="font-normal text-amber-600"> ListeningKit backs off automatically.</span>
          </p>
        ) : null}
      </div>
    </motion.div>
  )
}