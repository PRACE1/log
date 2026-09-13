import type { ConnectionRecord } from './types'

/**
 * The three Facebook accounts the mock Marketplace feed is published from.
 * The first matches the label a fresh install sees, so a connected install
 * lights up immediately; the other two are added accounts in the same label
 * space. Both the listings mock and the connections API consume these labels.
 */
export const MOCK_FACEBOOK_ACCOUNTS = ['Facebook', 'Galway Rubbish Co', 'Pacer Marketplace']

/**
 * In-memory seed for the connections API. The Facebook labels mirror
 * MOCK_FACEBOOK_ACCOUNTS one-to-one so the Listings account badges and the
 * Accounts table always agree on which accounts exist.
 *
 * The rows span the full normalized issue state space so the dashboard
 * badges and the account console have real material to render: healthy,
 * stale, never connected, checkpointed, proxy unreachable, read-only
 * limited, rate limited (with a countdown), IP blocked, and session expired.
 */
export const MOCK_CONNECTIONS: ConnectionRecord[] = [
  {
    id: 'fb-galway-rubbish',
    platform: 'facebook',
    label: 'Galway Rubbish Co',
    viaProxy: false,
    connectedAt: '2026-09-10T09:02:00+00:00'
  },
  {
    id: 'fb-pacer',
    platform: 'facebook',
    label: 'Pacer Marketplace',
    viaProxy: true,
    connectedAt: '2026-09-11T17:40:00+00:00',
    lastIssue: 'proxy_unreachable',
    rawSignal: { marker: 'ECONNREFUSED 203.0.113.42:8080' },
    lastCheckedAt: '2026-09-14T06:30:00+00:00'
  },
  {
    id: 'fb-personal',
    platform: 'facebook',
    label: 'Facebook',
    viaProxy: false,
    connectedAt: '2026-09-12T08:15:00+00:00',
    lastIssue: 'checkpointed',
    rawSignal: { code: 190, subcode: 459 },
    lastCheckedAt: '2026-09-14T07:05:00+00:00'
  },
  {
    id: 'x-listeningkit',
    platform: 'x',
    label: 'X',
    viaProxy: true,
    connectedAt: '2026-09-08T11:20:00+00:00',
    lastIssue: 'read_only_limited',
    rawSignal: { status: 200, marker: 'x-rate-limit-remaining: 3' },
    lastCheckedAt: '2026-09-14T06:50:00+00:00'
  },
  {
    id: 'x-ops',
    platform: 'x',
    label: 'X · Ops',
    viaProxy: false,
    connectedAt: '2026-09-13T22:10:00+00:00',
    lastIssue: 'rate_limited',
    rawSignal: { status: 429, code: 88 },
    lastCheckedAt: '2026-09-14T07:40:00+00:00',
    retryAfter: 1200
  },
  {
    id: 'x-legacy',
    platform: 'x',
    label: 'X · Legacy',
    viaProxy: false,
    connectedAt: '2026-08-30T08:00:00+00:00'
  },
  {
    id: 'reddit-listeningkit',
    platform: 'reddit',
    label: 'Reddit',
    viaProxy: false,
    connectedAt: null
  },
  {
    id: 'reddit-watch',
    platform: 'reddit',
    label: 'Reddit · Watch',
    viaProxy: true,
    connectedAt: '2026-09-09T14:25:00+00:00',
    lastIssue: 'ip_or_account_blocked',
    rawSignal: { status: 403, marker: 'network security' },
    lastCheckedAt: '2026-09-14T06:15:00+00:00'
  },
  {
    id: 'x-archived',
    platform: 'x',
    label: 'X · Archived',
    viaProxy: false,
    connectedAt: '2026-09-05T10:00:00+00:00',
    lastIssue: 'session_expired',
    rawSignal: { code: 89 },
    lastCheckedAt: '2026-09-14T05:55:00+00:00'
  }
]