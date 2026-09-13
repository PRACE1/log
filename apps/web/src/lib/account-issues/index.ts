export type {
  AccountIssue,
  AccountIssueInfo,
  AccountIssueRecord,
  IssueFix,
  IssueSeverity,
  RawSignal
} from './types'
export {
  ISSUE_CATALOG,
  LIFECYCLE_ISSUES,
  issueInfo,
  severityToState,
  type CatalogEntry
} from './catalog'
export { FIX_LABELS, normalizeSignal } from './normalize'
export { getAccountIssueEvents, type AccountIssueEvent } from './events'

import { assessAccountHealth, type AccountHealth } from '../health'
import type { ConnectionRecord } from '../connections/types'
import { issueInfo } from './catalog'
import type { AccountIssueInfo } from './types'

/**
 * Everything one account row needs to render its full issue state: the
 * lifecycle health (connected / stale / never) plus the active normalized
 * issue, when the client has observed one. The persisted `lastIssue` wins —
 * it is the ground truth the client saw; when there is none, a never
 * connected account resolves to the `never_connected` lifecycle issue.
 */
export interface AccountIssueSnapshot {
  health: AccountHealth
  issue: AccountIssueInfo | null
}

export function accountIssueSnapshot(
  record: ConnectionRecord,
  now: Date = new Date()
): AccountIssueSnapshot {
  const health = assessAccountHealth(record, now)
  const issue = record.lastIssue
    ? issueInfo(record.lastIssue, record.platform)
    : health.state === 'unhealthy' && record.connectedAt === null
      ? issueInfo('never_connected', record.platform)
      : null
  return { health, issue }
}

const SEVERITY_ORDER: Record<AccountIssueInfo['severity'], number> = {
  healthy: 0,
  degraded: 1,
  unhealthy: 2
}

/**
 * The effective state a badge should show: the worse of the lifecycle
 * health and the active issue's severity. A freshly "connected" account
 * that the client last saw suspended still reads unhealthy.
 */
export function effectiveSeverity(
  snapshot: AccountIssueSnapshot
): 'healthy' | 'degraded' | 'unhealthy' {
  const fromIssue = snapshot.issue ? SEVERITY_ORDER[snapshot.issue.severity] : -1
  const fromHealth = SEVERITY_ORDER[snapshot.health.state]
  const worst = Math.max(fromIssue, fromHealth)
  const names: Array<'healthy' | 'degraded' | 'unhealthy'> = ['healthy', 'degraded', 'unhealthy']
  return names[worst]
}