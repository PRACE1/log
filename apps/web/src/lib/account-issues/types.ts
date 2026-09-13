import type { ConnectionPlatform } from '../connections/types'

/**
 * The normalized, platform-agnostic vocabulary of everything that can happen
 * to an account. This is the research ("what can go wrong on Facebook / X /
 * Reddit with a live cookie") translated into one enum the whole dashboard
 * understands. Raw platform signals (HTTP status, `code`/`subcode`, page
 * markers) are mapped onto these values by `normalizeSignal`.
 */
export type AccountIssue =
  // Lifecycle — from our connection model, not the platform.
  | 'never_connected'
  | 'disconnected'
  | 'stale'
  // Session / credential.
  | 'session_expired'
  | 'session_invalidated_changed'
  | 'checkpointed'
  | 'unconfirmed_user'
  | 'cookie_invalid'
  // Suspended / banned.
  | 'suspended'
  | 'read_only_limited'
  | 'automated_flagged'
  // Rate / limit (transient).
  | 'rate_limited'
  | 'proxy_rate_limited'
  // Blocked / challenged.
  | 'challenge_interstitial'
  | 'ip_or_account_blocked'
  // Policy / permission / group.
  | 'restricted_policy'
  | 'permission_denied'
  | 'join_gate'
  | 'removed_from_group'
  // Transport (proxy).
  | 'proxy_unreachable'
  | 'proxy_auth_failed'
  | 'proxy_malformed'
  // False success — HTTP 200 whose body is not data.
  | 'login_wall'
  | 'captcha_html'
  // Roster.
  | 'unknown_platform'
  // Catch-all — the client saw a failure it could not map.
  | 'unknown'

/** Same bands as `AccountHealth.state`, so issues map 1:1 onto the Badge map. */
export type IssueSeverity = 'healthy' | 'degraded' | 'unhealthy'

/** The human-facing verb a remediation uses. Drives the console's action copy. */
export type IssueFix =
  | 'connect'
  | 'reconnect'
  | 'reexport_cookie'
  | 'login_in_browser'
  | 'wait'
  | 'use_proxy'
  | 'appeal'
  | 'rejoin'
  | 'resolve'
  | 'none'

export interface RawSignal {
  /** HTTP status the client saw (200 for the false-success cases). */
  status?: number
  /** Platform error code, e.g. Facebook Graph `190`, Twitter GraphQL `88`. */
  code?: number
  /** Platform error subcode, e.g. Facebook `459` (checkpointed). */
  subcode?: number
  /** Machine name of the error type, e.g. X `rate-limit-exceeded`, `client-forbidden`. */
  type?: string
  /** A short lowercased phrase matched against the response body/URL. */
  marker?: string
  /** The URL that produced the response (for login-wall detection). */
  url?: string
}

/**
 * The fully-resolved, ready-to-render description of one issue. This is what
 * the console and badges consume; it pairs the raw signal with its normalized
 * meaning, severity, whether it clears on its own, and what to do about it.
 */
export interface AccountIssueInfo {
  issue: AccountIssue
  label: string
  severity: IssueSeverity
  /** True if it typically clears without user action (rate limits, backoff). */
  transient: boolean
  /** Short one-line explanation of what happened, platform-agnostic. */
  detail: string
  /** The concrete signal that produced this (for the console trace). */
  signal: RawSignal
  /** What the user should actually do. */
  fix: IssueFix
  /** Platform-specific remediation copy, e.g. "Re-export the Facebook cookie". */
  remediation: string
  /** Which platforms can emit this (informational, for the console legend). */
  platforms: ConnectionPlatform[]
}

/** The per-account issue record persisted on a `ConnectionRecord`. */
export interface AccountIssueRecord {
  issue: AccountIssue
  /** When the client last observed this state. */
  checkedAt: string
  /**
   * Seconds until a transient issue is expected to clear, derived from the
   * platform's reset header (`x-rate-limit-reset` / `X-Ratelimit-Reset`).
   */
  retryAfter?: number
  /** The raw signal that was normalized into `issue`. */
  signal?: RawSignal
}