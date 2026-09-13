import type { ConnectionRecord } from '../connections/types'
import type { AccountIssue, RawSignal } from './types'
import { ISSUE_CATALOG } from './catalog'

/**
 * One entry in an account's firehose: a single normalized issue the client
 * observed for this account, at a point in time, with the raw signal that
 * produced it. The console renders these newest-first — the account's
 * history, not the platform's full state space.
 */
export interface AccountIssueEvent {
  id: string
  ts: string
  issue: AccountIssue
  signal: RawSignal
}

// History events are drawn from the platform's observable issue pool — the
// lifecycle states and the catch-alls never appear as "observed" events.
const HISTORY_POOL_EXCLUDE: ReadonlySet<AccountIssue> = new Set([
  'never_connected',
  'disconnected',
  'stale',
  'unknown_platform',
  'unknown'
])

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

const cache = new Map<string, AccountIssueEvent[]>()

/**
 * The deterministic mock firehose for one account: the issue history that
 * ends at the account's current state (`lastIssue`, or a cleared/transient
 * issue for healthy accounts). The same account always yields the same
 * stream, so the console stays stable across navigation.
 */
export function getAccountIssueEvents(record: ConnectionRecord): AccountIssueEvent[] {
  const hit = cache.get(record.id)
  if (hit) return hit

  const pool = (Object.keys(ISSUE_CATALOG) as AccountIssue[])
    .filter((issue) => !HISTORY_POOL_EXCLUDE.has(issue))
    .filter((issue) => ISSUE_CATALOG[issue].platforms.includes(record.platform))

  const events: AccountIssueEvent[] = []
  if (record.connectedAt !== null && pool.length > 0) {
    const seed = hashString(record.id)
    const count = record.lastIssue ? 4 + (seed % 4) : 1 + (seed % 3)
    const end = new Date(record.lastCheckedAt ?? record.connectedAt).getTime()
    let ts = end
    let previous: AccountIssue | null = null

    for (let i = 0; i < count; i++) {
      // The latest event is the account's current state; earlier ones are
      // history, never repeating the adjacent issue.
      let issue: AccountIssue
      if (i === 0 && record.lastIssue && !HISTORY_POOL_EXCLUDE.has(record.lastIssue)) {
        issue = record.lastIssue
      } else {
        issue = pool[(seed + i * 7) % pool.length]
        if (issue === previous) issue = pool[(seed + i * 7 + 1) % pool.length]
        // The latest event reads as the account's current state — a stale
        // "current" would contradict the healthy banner the list derives.
        if (i === 0 && (issue === 'stale' || issue === 'disconnected')) issue = pool[(seed + 3) % pool.length]
      }
      previous = issue

      const entry = ISSUE_CATALOG[issue]
      // The current event shows the signal the client actually recorded;
      // history events fall back to the catalog's canonical signature.
      const signal: RawSignal =
        (i === 0 ? record.rawSignal : undefined) ?? entry.defaultSignal[record.platform] ?? {}

      events.push({
        id: `${record.id}-${i}`,
        ts: new Date(ts).toISOString(),
        issue,
        signal
      })

      ts -= (45 + ((seed >> i) % 240)) * 60_000
    }
  }

  cache.set(record.id, events)
  return events
}