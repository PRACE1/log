import type { ConnectionRecord } from '../connections'

/**
 * Account health, shared by every dashboard surface that shows an account:
 * the Accounts table, the Keywords/Groups/Listings account badges, and the
 * SocialBadge dots. One assessment, one vocabulary — a badge never decides
 * unhealthy on its own.
 *
 * - `healthy`   — connected, with recent activity.
 * - `degraded`  — connected, but the last successful connect is older than
 *                 STALE_AFTER_DAYS; the connection may still be broken.
 * - `unhealthy` — never connected (or disconnected): nothing is listening
 *                 on this account.
 */

export type AccountHealthState = 'healthy' | 'degraded' | 'unhealthy'

export interface AccountHealth {
  state: AccountHealthState
  /** One-line human reason, safe for tooltips and titles. */
  reason: string
  /** Days since the last successful connect (undefined when never connected). */
  daysSinceConnect?: number
}

/** A connected account older than this reads as `degraded`, not healthy. */
export const STALE_AFTER_DAYS = 7

const DAY_MS = 86_400_000

function daysBetween(fromIso: string, now: Date): number {
  const then = new Date(fromIso).getTime()
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.floor((now.getTime() - then) / DAY_MS))
}

/** Assess one account record. `now` is injectable for deterministic tests. */
export function assessAccountHealth(
  record: Pick<ConnectionRecord, 'connectedAt'>,
  now: Date = new Date()
): AccountHealth {
  if (record.connectedAt === null) {
    return { state: 'unhealthy', reason: 'Not connected — nothing is listening on this account.' }
  }
  const days = daysBetween(record.connectedAt, now)
  if (days >= STALE_AFTER_DAYS) {
    return {
      state: 'degraded',
      reason: `No successful connect for ${days} days — verify the connection still holds.`,
      daysSinceConnect: days
    }
  }
  return { state: 'healthy', reason: 'Connected and listening.', daysSinceConnect: days }
}

/**
 * Health for a raw connectedAt timestamp — for rows that carry the label
 * instead of the full record (listings carry the account label, not the id).
 */
export function healthForConnectedAt(connectedAt: string | null, now: Date = new Date()): AccountHealth {
  return assessAccountHealth({ connectedAt }, now)
}

/**
 * Resolve a record's health by display label. Listings and communities
 * reference accounts by label (the shared label space), so label lookup is
 * the dashboard-wide join.
 */
export function healthForLabel(
  accounts: readonly ConnectionRecord[],
  label: string,
  now: Date = new Date()
): AccountHealth | null {
  const record = accounts.find((account) => account.label === label)
  return record ? assessAccountHealth(record, now) : null
}

/**
 * Health for a scope's joining account, resolved by account id (keywords
 * and communities both carry `accountId`). A scope that references an
 * account missing from the roster counts as unhealthy — the badge has to
 * flag it, not quietly stay neutral. Returns null when the scope has no
 * account at all (e.g. subreddits), which callers render as "no account
 * needed", never as a health flag.
 */
export function healthForAccountId(
  accounts: readonly ConnectionRecord[],
  accountId: string | null,
  now: Date = new Date()
): AccountHealth | null {
  if (accountId === null) return null
  const record = accounts.find((account) => account.id === accountId)
  if (!record) return { state: 'unhealthy', reason: 'Account no longer exists in the roster.' }
  return assessAccountHealth(record, now)
}

/**
 * Worst-case health across a set of accounts — the aggregate the header
 * SocialBadge dot carries. `neutral` when the set is empty (nothing to
 * report is not "healthy").
 */
export function worstHealth(
  accounts: readonly ConnectionRecord[],
  now: Date = new Date()
): AccountHealthState | 'neutral' {
  if (accounts.length === 0) return 'neutral'
  const order: Record<AccountHealthState, number> = { healthy: 0, degraded: 1, unhealthy: 2 }
  let worst: AccountHealthState = 'healthy'
  for (const account of accounts) {
    const state = assessAccountHealth(account, now).state
    if (order[state] > order[worst]) worst = state
  }
  return worst
}