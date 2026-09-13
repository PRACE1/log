import type { ConnectionPlatform } from '../connections/types'
import type { AccountIssue, AccountIssueInfo, IssueFix, IssueSeverity, RawSignal } from './types'

/**
 * The normalized catalog: one entry per `AccountIssue`, carrying everything
 * the UI needs to render and explain it. This is the research ("what can go
 * wrong per platform") translated into the single vocabulary the dashboard
 * uses. `defaultSignal` is the canonical detector signature (the exact
 * code/subcode/status/marker the Camoufox client keys on) per platform.
 */
export interface CatalogEntry {
  label: string
  severity: IssueSeverity
  transient: boolean
  detail: Record<ConnectionPlatform, string>
  fix: IssueFix
  remediation: Record<ConnectionPlatform, string>
  platforms: ConnectionPlatform[]
  defaultSignal: Partial<Record<ConnectionPlatform, RawSignal>>
}

const ALL: ConnectionPlatform[] = ['facebook', 'x', 'reddit']

export const ISSUE_CATALOG: Record<AccountIssue, CatalogEntry> = {
  never_connected: {
    label: 'Not connected',
    severity: 'unhealthy',
    transient: false,
    fix: 'connect',
    platforms: ALL,
    detail: {
      facebook: 'No Facebook cookie has been verified for this account yet — nothing is being read.',
      x: 'No X session (auth_token + ct0) has been verified for this account yet — nothing is being read.',
      reddit: 'No Reddit session has been verified for this account yet — nothing is being read.'
    },
    remediation: {
      facebook: 'Paste a Facebook cookie from the extension in Settings to connect.',
      x: 'Export the X cookie (auth_token + ct0) from the extension in Settings to connect.',
      reddit: 'Paste a Reddit session cookie from the extension in Settings to connect.'
    },
    defaultSignal: {}
  },
  disconnected: {
    label: 'Disconnected',
    severity: 'unhealthy',
    transient: false,
    fix: 'reconnect',
    platforms: ALL,
    detail: {
      facebook: 'This account was intentionally disconnected; the row is kept so its groups remain linked.',
      x: 'This account was intentionally disconnected; the row is kept so its groups remain linked.',
      reddit: 'This account was intentionally disconnected; the row is kept so its groups remain linked.'
    },
    remediation: {
      facebook: 'Reconnect with a fresh Facebook cookie in Settings.',
      x: 'Reconnect with a fresh X cookie in Settings.',
      reddit: 'Reconnect with a fresh Reddit session in Settings.'
    },
    defaultSignal: {}
  },
  stale: {
    label: 'Stale connection',
    severity: 'degraded',
    transient: false,
    fix: 'reconnect',
    platforms: ALL,
    detail: {
      facebook: 'Last successful connect is more than 7 days old — the Facebook session may have expired silently.',
      x: 'Last successful connect is more than 7 days old — the X session may have expired silently.',
      reddit: 'Last successful connect is more than 7 days old — the Reddit session may have expired silently.'
    },
    remediation: {
      facebook: 'Run Test Connection, or re-export the Facebook cookie if it fails.',
      x: 'Run Test Connection, or re-export the X cookie if it fails.',
      reddit: 'Run Test Connection, or re-export the Reddit session if it fails.'
    },
    defaultSignal: {}
  },
  session_expired: {
    label: 'Session expired',
    severity: 'unhealthy',
    transient: false,
    fix: 'reexport_cookie',
    platforms: ALL,
    detail: {
      facebook: 'Facebook is now serving a login page instead of the account\u2019s data \u2014 the saved session outlived its lifetime (Graph OAuthException 190).',
      x: 'X rejects the saved session with an invalid-or-expired token (GraphQL code 89) \u2014 the auth_token / ct0 pair is dead.',
      reddit: 'Authenticated calls return 401 \u2014 the session cookie is no longer valid and no refresh token is keeping it alive.'
    },
    remediation: {
      facebook: 'Log in at facebook.com in a normal browser, then re-export the cookie to Settings.',
      x: 'Log in at x.com in a normal browser, then re-export auth_token + ct0 to Settings.',
      reddit: 'Log in at reddit.com in a normal browser, then re-export the session cookie to Settings.'
    },
    defaultSignal: {
      facebook: { code: 190, subcode: 463 },
      x: { code: 89 },
      reddit: { status: 401 }
    }
  },
  session_invalidated_changed: {
    label: 'Session invalidated (password change)',
    severity: 'unhealthy',
    transient: false,
    fix: 'reexport_cookie',
    platforms: ALL,
    detail: {
      facebook: 'Facebook invalidated the saved session because the account password changed (subcode 460) \u2014 the cookie is dead even though nothing was typed wrong.',
      x: 'X has revoked the session \u2014 typically the account password changed, so the stored token no longer authenticates.',
      reddit: 'Reddit revoked the session \u2014 usually a password change invalidated the stored credential.'
    },
    remediation: {
      facebook: 'Confirm the current password at facebook.com, then re-export the fresh cookie to Settings.',
      x: 'Confirm the current password at x.com, then re-export auth_token + ct0 to Settings.',
      reddit: 'Confirm the current password at reddit.com, then re-export the session cookie to Settings.'
    },
    defaultSignal: {
      facebook: { code: 190, subcode: 460 },
      x: { code: 89 },
      reddit: { status: 401 }
    }
  },
  checkpointed: {
    label: 'Checkpoint challenge',
    severity: 'unhealthy',
    transient: false,
    fix: 'login_in_browser',
    platforms: ['facebook'],
    detail: {
      facebook: 'Facebook placed the account on a checkpoint (subcode 459) \u2014 a human must clear a login-confirmation step at facebook.com; the cookie alone cannot clear it.',
      x: '\u2014',
      reddit: '\u2014'
    },
    remediation: {
      facebook: 'Log in at facebook.com in a normal browser and clear the checkpoint, then re-export the cookie.',
      x: '\u2014',
      reddit: '\u2014'
    },
    defaultSignal: { facebook: { code: 190, subcode: 459 } }
  },
  unconfirmed_user: {
    label: 'Account needs confirmation',
    severity: 'unhealthy',
    transient: false,
    fix: 'login_in_browser',
    platforms: ['facebook'],
    detail: {
      facebook: 'Facebook requires the account to confirm an identity or contact detail before the session works (subcode 464).',
      x: '\u2014',
      reddit: '\u2014'
    },
    remediation: {
      facebook: 'Complete the confirmation at facebook.com in a normal browser, then re-export the cookie.',
      x: '\u2014',
      reddit: '\u2014'
    },
    defaultSignal: { facebook: { code: 190, subcode: 464 } }
  },
  cookie_invalid: {
    label: 'Cookie rejected',
    severity: 'unhealthy',
    transient: false,
    fix: 'reexport_cookie',
    platforms: ALL,
    detail: {
      facebook: 'The pasted cookie was rejected at connect time \u2014 too short, malformed, or exported from the wrong browser.',
      x: 'The pasted auth_token / ct0 was rejected at connect time \u2014 malformed or from a different browser session.',
      reddit: 'The pasted session cookie was rejected at connect time \u2014 malformed or from a different session.'
    },
    remediation: {
      facebook: 'Re-export the cookie from a browser you are currently logged into Facebook on.',
      x: 'Re-export auth_token + ct0 from a browser you are currently logged into X on.',
      reddit: 'Re-export the session cookie from a browser you are currently logged into Reddit on.'
    },
    defaultSignal: {}
  },
  suspended: {
    label: 'Account suspended',
    severity: 'unhealthy',
    transient: false,
    fix: 'appeal',
    platforms: ALL,
    detail: {
      facebook: 'Facebook has restricted the account itself \u2014 every page returns a restriction notice instead of data.',
      x: 'X has suspended the account (\u201cThis account is suspended\u201d / GraphQL code 97) \u2014 usually for perceived non-authentic or automated behavior.',
      reddit: 'Reddit has suspended the account \u2014 login surfaces a suspension notice; reads return 403.'
    },
    remediation: {
      facebook: 'Appeal via Facebook\u2019s restriction notice in a normal browser; the cookie cannot be fixed.',
      x: 'Appeal via X\u2019s suspension notice in a normal browser; the cookie cannot be fixed.',
      reddit: 'Appeal via Reddit\u2019s suspension notice in a normal browser; the cookie cannot be fixed.'
    },
    defaultSignal: {
      facebook: { marker: 'restricted' },
      x: { code: 97 },
      reddit: { status: 403, marker: 'suspended' }
    }
  },
  read_only_limited: {
    label: 'Read-only (shadow-limited)',
    severity: 'degraded',
    transient: false,
    fix: 'resolve',
    platforms: ['x'],
    detail: {
      facebook: '\u2014',
      x: 'X has flagged the account to read-only mode: it still serves some data but the rate-limit ceiling collapses (~10 reqs vs ~50) and the x-rate-limit-* headers stop being reliable.',
      reddit: '\u2014'
    },
    remediation: {
      facebook: '\u2014',
      x: 'Stop automating this account, warm it up with a normal browser on a residential IP, then re-test.',
      reddit: '\u2014'
    },
    defaultSignal: { x: { code: 88 } }
  },
  automated_flagged: {
    label: 'Flagged as automated',
    severity: 'unhealthy',
    transient: false,
    fix: 'resolve',
    platforms: ALL,
    detail: {
      facebook: 'Facebook\u2019s automation detection is blocking the session \u2014 a challenge wall sits between the account and its data.',
      x: 'X returned code 226 (\u201cthis request looks like it might be automated\u201d) and is serving an Arkose challenge before any data.',
      reddit: 'Reddit\u2019s bot detection is serving a challenge page instead of the account\u2019s data.'
    },
    remediation: {
      facebook: 'Clear the challenge in a real browser on a residential IP, then re-export the cookie.',
      x: 'Clear the Arkose challenge in a real browser on a residential IP, then re-export the cookie.',
      reddit: 'Clear the challenge in a real browser on a residential IP, then re-export the session.'
    },
    defaultSignal: {
      facebook: { marker: 'challenge' },
      x: { code: 226 },
      reddit: { marker: 'challenge' }
    }
  },
  rate_limited: {
    label: 'Rate limited',
    severity: 'degraded',
    transient: true,
    fix: 'wait',
    platforms: ALL,
    detail: {
      facebook: 'Facebook has temporarily throttled the account (code 4 / 17) \u2014 it clears on its own after the window resets.',
      x: 'X returned 429 / GraphQL code 88; the limit resets at the timestamp in the x-rate-limit-reset header.',
      reddit: 'Reddit returned 429; the reset is in the X-Ratelimit-Reset header (100 req/min OAuth window, plus per-endpoint limits).'
    },
    remediation: {
      facebook: 'No action needed \u2014 ListeningKit backs off until the window resets.',
      x: 'No action needed \u2014 ListeningKit backs off until the limit resets.',
      reddit: 'No action needed \u2014 ListeningKit backs off until the limit resets.'
    },
    defaultSignal: {
      facebook: { code: 4 },
      x: { status: 429, code: 88 },
      reddit: { status: 429 }
    }
  },
  proxy_rate_limited: {
    label: 'Proxy rate limited',
    severity: 'degraded',
    transient: true,
    fix: 'wait',
    platforms: ALL,
    detail: {
      facebook: 'The proxy provider itself is returning a rate-limit response before the request reaches Facebook.',
      x: 'The proxy provider itself is returning a rate-limit response before the request reaches X.',
      reddit: 'The proxy provider itself is returning a rate-limit response before the request reaches Reddit.'
    },
    remediation: {
      facebook: 'Check the proxy billing / concurrent-connection plan, or rotate to a fresh proxy endpoint.',
      x: 'Check the proxy billing / concurrent-connection plan, or rotate to a fresh proxy endpoint.',
      reddit: 'Check the proxy billing / concurrent-connection plan, or rotate to a fresh proxy endpoint.'
    },
    defaultSignal: {}
  },
  challenge_interstitial: {
    label: 'Bot challenge pending',
    severity: 'degraded',
    transient: true,
    fix: 'resolve',
    platforms: ALL,
    detail: {
      facebook: 'A reCAPTCHA / checkpoint challenge is interposed before the data; it usually clears once a real browser passes it.',
      x: 'An Arkose or Cloudflare challenge is interposed before the data.',
      reddit: 'A captcha interstitial is interposed; until it\u2019s solved the account returns 200 HTML where data should be.'
    },
    remediation: {
      facebook: 'Open the account in a real browser and clear the challenge, then resume.',
      x: 'Open the account in a real browser and clear the challenge, then resume.',
      reddit: 'Open the account in a real browser and clear the captcha, then resume.'
    },
    defaultSignal: {
      facebook: { marker: 'recaptcha' },
      x: { marker: 'arkose' },
      reddit: { marker: 'captcha' }
    }
  },
  ip_or_account_blocked: {
    label: 'Blocked (IP / bot detection)',
    severity: 'degraded',
    transient: false,
    fix: 'use_proxy',
    platforms: ['reddit', 'x'],
    detail: {
      facebook: '\u2014',
      x: 'X is refusing the request (403) \u2014 usually because the exit IP is flagged, not the account itself.',
      reddit: 'Reddit returned 403 \u201cblocked\u201d \u2014 almost always IP reputation / bot detection (datacenter IPs get throttled to ~10 req/min), not bad credentials.'
    },
    remediation: {
      facebook: '\u2014',
      x: 'Route this account through a residential proxy in Settings.',
      reddit: 'Route this account through a residential proxy in Settings \u2014 the cookie is fine.'
    },
    defaultSignal: {
      x: { status: 403 },
      reddit: { status: 403 }
    }
  },
  restricted_policy: {
    label: 'Temporarily restricted (policy)',
    severity: 'degraded',
    transient: true,
    fix: 'wait',
    platforms: ['facebook'],
    detail: {
      facebook: 'Facebook is temporarily blocking the account for policy violations (code 368) \u2014 \u201cwait and retry\u201d.',
      x: '\u2014',
      reddit: '\u2014'
    },
    remediation: {
      facebook: 'Reduce activity on this account and retry after the restriction window.',
      x: '\u2014',
      reddit: '\u2014'
    },
    defaultSignal: { facebook: { code: 368 } }
  },
  permission_denied: {
    label: 'Permission denied',
    severity: 'degraded',
    transient: false,
    fix: 'rejoin',
    platforms: ALL,
    detail: {
      facebook: 'The account no longer has permission for a resource (code 10) \u2014 most often removed from, or locked out of, a group.',
      x: 'X is refusing the resource (403 client-forbidden) \u2014 protected content the account can no longer see.',
      reddit: 'Reddit is refusing the resource (403) \u2014 the account lost access to that subreddit/resource.'
    },
    remediation: {
      facebook: 'Re-join the group from a real browser, then resume polling.',
      x: 'Re-establish access in a real browser, then resume polling.',
      reddit: 'Re-join / re-enable access in a real browser, then resume polling.'
    },
    defaultSignal: {
      facebook: { code: 10 },
      x: { status: 403, type: 'client-forbidden' },
      reddit: { status: 403 }
    }
  },
  join_gate: {
    label: 'Join gate (entry questions)',
    severity: 'degraded',
    transient: false,
    fix: 'rejoin',
    platforms: ['facebook'],
    detail: {
      facebook: 'The group requires entry-question answers (or admin approval) before the account can read it \u2014 the join form was rejected until answered.',
      x: '\u2014',
      reddit: '\u2014'
    },
    remediation: {
      facebook: 'Answer the entry questions in a real browser, then re-run the join from Settings.',
      x: '\u2014',
      reddit: '\u2014'
    },
    defaultSignal: { facebook: { marker: 'entry questions' } }
  },
  removed_from_group: {
    label: 'Removed from group',
    severity: 'degraded',
    transient: false,
    fix: 'rejoin',
    platforms: ALL,
    detail: {
      facebook: 'The group admins removed the account; polling now returns \u201ccontent not available\u201d instead of posts.',
      x: 'The list / community the account was tracking no longer includes it.',
      reddit: 'The subreddit removed the account, or the thread is only visible to members it no longer is.'
    },
    remediation: {
      facebook: 'Re-join the group from a real browser, then resume polling.',
      x: 'Re-join the list / community from a real browser, then resume polling.',
      reddit: 'Re-join the subreddit from a real browser, then resume polling.'
    },
    defaultSignal: {
      facebook: { marker: 'content not available' },
      x: { status: 404, type: 'resource-not-found' },
      reddit: { status: 404 }
    }
  },
  proxy_unreachable: {
    label: 'Proxy unreachable',
    severity: 'degraded',
    transient: false,
    fix: 'use_proxy',
    platforms: ALL,
    detail: {
      facebook: 'The configured proxy could not be reached (DNS failure, host down, or TLS handshake error) \u2014 the request never left the proxy layer.',
      x: 'The configured proxy could not be reached (DNS failure, host down, or TLS handshake error) \u2014 the request never left the proxy layer.',
      reddit: 'The configured proxy could not be reached (DNS failure, host down, or TLS handshake error) \u2014 the request never left the proxy layer.'
    },
    remediation: {
      facebook: 'Verify the proxy URL scheme/credentials, or switch the account to Direct.',
      x: 'Verify the proxy URL scheme/credentials, or switch the account to Direct.',
      reddit: 'Verify the proxy URL scheme/credentials, or switch the account to Direct.'
    },
    defaultSignal: {}
  },
  proxy_auth_failed: {
    label: 'Proxy auth failed',
    severity: 'degraded',
    transient: false,
    fix: 'use_proxy',
    platforms: ALL,
    detail: {
      facebook: 'The proxy rejected the credentials (HTTP 407) \u2014 bad username/password or the subscription lapsed.',
      x: 'The proxy rejected the credentials (HTTP 407) \u2014 bad username/password or the subscription lapsed.',
      reddit: 'The proxy rejected the credentials (HTTP 407) \u2014 bad username/password or the subscription lapsed.'
    },
    remediation: {
      facebook: 'Fix the proxy credentials in Settings, or route the account Direct.',
      x: 'Fix the proxy credentials in Settings, or route the account Direct.',
      reddit: 'Fix the proxy credentials in Settings, or route the account Direct.'
    },
    defaultSignal: {}
  },
  proxy_malformed: {
    label: 'Proxy URL invalid',
    severity: 'degraded',
    transient: false,
    fix: 'use_proxy',
    platforms: ALL,
    detail: {
      facebook: 'The stored proxy URL has no scheme or is malformed (expected http://, https://, or socks5://user:pass@host:port).',
      x: 'The stored proxy URL has no scheme or is malformed (expected http://, https://, or socks5://user:pass@host:port).',
      reddit: 'The stored proxy URL has no scheme or is malformed (expected http://, https://, or socks5://user:pass@host:port).'
    },
    remediation: {
      facebook: 'Fix the proxy URL in Settings — include the scheme and host:port.',
      x: 'Fix the proxy URL in Settings — include the scheme and host:port.',
      reddit: 'Fix the proxy URL in Settings — include the scheme and host:port.'
    },
    defaultSignal: {}
  },
  login_wall: {
    label: 'Login wall (false success)',
    severity: 'unhealthy',
    transient: false,
    fix: 'reexport_cookie',
    platforms: ALL,
    detail: {
      facebook: 'Facebook answered 200 OK but returned the login page instead of data — the session is dead, and the status code says nothing.',
      x: 'X answered 200 OK but returned a sign-in interstitial instead of data — the session is dead, and the status code says nothing.',
      reddit: 'Reddit answered 200 OK but returned an HTML login page instead of JSON — the session is dead, and the status code says nothing.'
    },
    remediation: {
      facebook: 'Log in at facebook.com in a normal browser, then re-export the cookie to Settings.',
      x: 'Log in at x.com in a normal browser, then re-export auth_token + ct0 to Settings.',
      reddit: 'Log in at reddit.com in a normal browser, then re-export the session cookie to Settings.'
    },
    defaultSignal: {
      facebook: { status: 200, marker: 'log in to facebook' },
      x: { status: 200, marker: 'login|x.com' },
      reddit: { status: 200, marker: 'login' }
    }
  },
  captcha_html: {
    label: 'Captcha interstitial (false success)',
    severity: 'unhealthy',
    transient: false,
    fix: 'resolve',
    platforms: ALL,
    detail: {
      facebook: 'Facebook answered 200 OK but served a challenge page instead of data — the body is HTML, not the expected payload.',
      x: 'X answered 200 OK but served an Arkose/Cloudflare challenge instead of data — the body is HTML, not the expected payload.',
      reddit: 'Reddit answered 200 OK but served a captcha page instead of JSON — the body is HTML, not the expected payload.'
    },
    remediation: {
      facebook: 'Solve the challenge in a real browser on a residential IP, then resume polling.',
      x: 'Solve the challenge in a real browser on a residential IP, then resume polling.',
      reddit: 'Solve the captcha in a real browser on a residential IP, then resume polling.'
    },
    defaultSignal: {
      facebook: { status: 200, marker: 'recaptcha' },
      x: { status: 200, marker: 'arkose' },
      reddit: { status: 200, marker: 'captcha' }
    }
  },
  unknown_platform: {
    label: 'Unsupported platform',
    severity: 'unhealthy',
    transient: false,
    fix: 'none',
    platforms: ALL,
    detail: {
      facebook: 'This account\u2019s platform was retired from ListeningKit; the row is hidden from live polling until removed.',
      x: 'This account\u2019s platform was retired from ListeningKit; the row is hidden from live polling until removed.',
      reddit: 'This account\u2019s platform was retired from ListeningKit; the row is hidden from live polling until removed.'
    },
    remediation: {
      facebook: 'Delete the row, or restore the platform when it ships again.',
      x: 'Delete the row, or restore the platform when it ships again.',
      reddit: 'Delete the row, or restore the platform when it ships again.'
    },
    defaultSignal: {}
  },
  unknown: {
    label: 'Unrecognized failure',
    severity: 'degraded',
    transient: false,
    fix: 'resolve',
    platforms: ALL,
    detail: {
      facebook: 'The client observed a failure that does not map to a known Facebook error — the raw signal is preserved below for triage.',
      x: 'The client observed a failure that does not map to a known X error — the raw signal is preserved below for triage.',
      reddit: 'The client observed a failure that does not map to a known Reddit error — the raw signal is preserved below for triage.'
    },
    remediation: {
      facebook: 'Retry a manual check; if it persists, inspect the raw signal and extend the detector.',
      x: 'Retry a manual check; if it persists, inspect the raw signal and extend the detector.',
      reddit: 'Retry a manual check; if it persists, inspect the raw signal and extend the detector.'
    },
    defaultSignal: {}
  }
}

/** Convenience: the lifecycle issues that are derived from our own model, not a platform signal. */
export const LIFECYCLE_ISSUES: AccountIssue[] = ['never_connected', 'disconnected', 'stale']

/**
 * Resolve a normalized issue into the full render-ready descriptor for a
 * platform. `signal` (when present) is the raw signal actually observed;
 * otherwise the entry's canonical per-platform signal is used.
 */
export function issueInfo(
  issue: AccountIssue,
  platform: ConnectionPlatform,
  signal?: RawSignal
): AccountIssueInfo {
  const entry = ISSUE_CATALOG[issue]
  return {
    issue,
    label: entry.label,
    severity: entry.severity,
    transient: entry.transient,
    detail: entry.detail[platform] ?? '',
    signal: signal ?? entry.defaultSignal[platform] ?? {},
    fix: entry.fix,
    remediation: entry.remediation[platform] ?? '',
    platforms: entry.platforms
  }
}

/** Severity → the Badge `state` name, so existing Badge maps consume issues unchanged. */
export function severityToState(severity: IssueSeverity): 'healthy' | 'degraded' | 'unhealthy' {
  return severity
}