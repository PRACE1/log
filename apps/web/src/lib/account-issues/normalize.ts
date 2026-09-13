import type { ConnectionPlatform } from '../connections/types'
import type { AccountIssue, IssueFix, RawSignal } from './types'

/**
 * The detector contract: given what the Camoufox client actually saw
 * (status + platform code/subcode + body/URL markers), return the one
 * normalized `AccountIssue`. This is where the per-platform research
 * ("FB 190/459 = checkpoint, X 88 = rate limited, Reddit 403 = IP block")
 * becomes code. Priority order matters: specific codes before generic ones,
 * and the 200-with-HTML false-success checks run on body markers, never on
 * the status code alone.
 */
export function normalizeSignal(platform: ConnectionPlatform, signal: RawSignal): AccountIssue {
  switch (platform) {
    case 'facebook':
      return normalizeFacebook(signal)
    case 'x':
      return normalizeX(signal)
    case 'reddit':
      return normalizeReddit(signal)
  }
}

function has(signal: RawSignal, ...needles: string[]): boolean {
  const haystack = `${signal.marker ?? ''} ${signal.url ?? ''}`.toLowerCase()
  return needles.some((n) => haystack.includes(n.toLowerCase()))
}

function normalizeFacebook(s: RawSignal): AccountIssue {
  // Graph API error codes that surface on authenticated loads.
  if (s.code === 190) {
    if (s.subcode === 459) return 'checkpointed'
    if (s.subcode === 460) return 'session_invalidated_changed'
    if (s.subcode === 464) return 'unconfirmed_user'
    if (s.subcode === 467) return 'cookie_invalid'
    // 190 with no subcode, or subcode 463: session expired.
    return 'session_expired'
  }
  if (s.code === 102) return 'session_expired'
  if (s.code === 10) return 'permission_denied'
  if (s.code === 4 || s.code === 17 || s.code === 341) return 'rate_limited'
  if (s.code === 368) return 'restricted_policy'

  // False success: 200 whose body is a login wall or a challenge page.
  if (s.status === 200) {
    if (has(s, 'recaptcha', 'challenge', 'arkose', 'captcha')) return 'captcha_html'
    if (has(s, 'login', 'log in', 'welcome to facebook')) return 'login_wall'
  }
  if (s.status === 401) return 'session_expired'
  if (s.status === 429) return 'rate_limited'
  if (s.status === 403) {
    if (has(s, 'restricted', 'confirm', 'checkpoint', 'verify')) return 'suspended'
    return 'permission_denied'
  }
  if (has(s, 'entry question')) return 'join_gate'
  if (has(s, 'content not available', 'not available')) return 'removed_from_group'
  if (has(s, 'suspended', 'disabled')) return 'suspended'
  return 'unknown'
}

function normalizeX(s: RawSignal): AccountIssue {
  // GraphQL app errors carry a numeric code (v1.1 lineage, still returned).
  if (s.code === 226) return 'automated_flagged'
  if (s.code === 97 || s.code === 64) return 'suspended'
  if (s.code === 215) return 'cookie_invalid'
  if (s.code === 89 || s.code === 32) return 'session_expired'
  if (s.code === 88) return 'rate_limited'

  // Structured v2 error types.
  if (s.type === 'rate-limit-exceeded' || s.type === 'usage-capped') return 'rate_limited'
  if (s.type === 'not-authorized-for-resource') return 'permission_denied'
  if (s.type === 'client-forbidden') return s.status === 403 ? 'ip_or_account_blocked' : 'permission_denied'
  if (s.type === 'resource-not-found') return 'removed_from_group'

  if (s.status === 429) return 'rate_limited'
  if (s.status === 401) return 'session_expired'
  if (s.status === 403) {
    // X 403 with valid auth = the exit IP is flagged, not the account.
    if (has(s, 'challenge', 'arkose', 'verify')) return 'challenge_interstitial'
    return 'ip_or_account_blocked'
  }
  if (s.status === 404) return 'removed_from_group'
  if (s.status === 200) {
    if (has(s, 'arkose', 'challenge', 'captcha', 'verify your account')) return 'captcha_html'
    if (has(s, 'login', 'sign in')) return 'login_wall'
  }
  if (has(s, 'suspended')) return 'suspended'
  return 'unknown'
}

function normalizeReddit(s: RawSignal): AccountIssue {
  if (s.status === 401) return 'session_expired'
  if (s.status === 403) {
    if (has(s, 'suspended')) return 'suspended'
    if (has(s, 'captcha', 'challenge')) return 'challenge_interstitial'
    // Signature Reddit 403: IP reputation / bot detection, not bad credentials.
    return 'ip_or_account_blocked'
  }
  if (s.status === 429) return 'rate_limited'
  if (s.status === 404) return 'removed_from_group'
  if (s.status === 200) {
    // The signature Reddit false success: 200 OK whose body is HTML, not JSON.
    const marker = (s.marker ?? '').toLowerCase()
    if (has(s, 'captcha', 'challenge')) return 'captcha_html'
    if (has(s, 'login', 'log in') || marker.startsWith('<!doctype') || marker.startsWith('<html')) {
      return 'login_wall'
    }
  }
  if (has(s, 'blocked')) return 'ip_or_account_blocked'
  if (has(s, 'suspended')) return 'suspended'
  return 'unknown'
}

/**
 * Human labels for the fix verbs, so the console can render one consistent
 * "Next step" row across every issue in the catalog.
 */
export const FIX_LABELS: Record<IssueFix, string> = {
  connect: 'Connect account',
  reconnect: 'Reconnect',
  reexport_cookie: 'Re-export cookie',
  login_in_browser: 'Verify in your browser',
  wait: 'Backs off automatically',
  use_proxy: 'Route via proxy',
  appeal: 'Appeal with the platform',
  rejoin: 'Re-join group',
  resolve: 'Resolve in your browser',
  none: 'No action needed'
}