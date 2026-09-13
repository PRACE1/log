import type { ConnectionPlatform } from '../connections'
import { MOCK_CONNECTIONS } from '../connections/mock'
import type { Community, CommunityJoinState } from './types'

/**
 * Base community catalog — the same roster the old flat lib/communities.ts
 * exposed. Membership state (joinState / accountId) lives in the server, not
 * here, so the catalog stays pure and the API owns the relation.
 */
export const COMMUNITIES_BASE: Array<Omit<Community, 'joinState' | 'accountId' | 'accountLabel' | 'answers'>> = [
  {
    id: 'facebook-dallas-homeowners',
    platform: 'facebook' satisfies ConnectionPlatform,
    name: 'Dallas Homeowners',
    handle: '@dallas-homeowners',
    members: '48k members',
    description: 'Leaks, repairs and contractor referrals across Dallas–Fort Worth.',
    url: 'https://facebook.com/groups/dallas-homeowners',
    entryQuestions: [
      'What Dallas–Fort Worth street do you live on?',
      'Are you a homeowner or a contractor?',
      'Will you post photos when asking for repair help?',
    ],
  },
  {
    id: 'facebook-texas-trades',
    platform: 'facebook' satisfies ConnectionPlatform,
    name: 'Texas Trades Network',
    handle: '@texastrades',
    members: '12k members',
    description: 'Licensed tradespeople swapping jobs and advice across Texas.',
    url: 'https://facebook.com/groups/texastrades',
    entryQuestions: [
      'What trade are you licensed in?',
      'How many years have you been working in Texas?',
      'Do you agree to no self-promotion outside the weekly thread?',
    ],
  },
  {
    id: 'facebook-diy-plumbing',
    platform: 'facebook' satisfies ConnectionPlatform,
    name: 'DIY Plumbing Help',
    handle: '@diyplumbing',
    members: '89k members',
    description: 'Homeowners posting photos of whatever just started leaking.',
    url: 'https://facebook.com/groups/diyplumbing',
    entryQuestions: [
      'What are you trying to fix right now?',
      'Have you turned off the water supply before starting work?',
      'Do you agree to post a photo with every help request?',
    ],
  },
  {
    id: 'x-dallas-tx',
    platform: 'x' satisfies ConnectionPlatform,
    name: 'Dallas, TX',
    handle: '@dallas-tx',
    members: '210k members',
    description: 'Real-time local chatter — outages, storms and service calls.',
    url: 'https://x.com/search?q=dallas%20tx&f=live',
    entryQuestions: [],
  },
  {
    id: 'x-home-improvement',
    platform: 'x' satisfies ConnectionPlatform,
    name: 'Home Improvement',
    handle: '@home-improvement',
    members: '1.2m members',
    description: 'Renovations, repairs and before-and-after threads.',
    url: 'https://x.com/search?q=home%20improvement&f=live',
    entryQuestions: [],
  },
  {
    id: 'x-plumbing-talk',
    platform: 'x' satisfies ConnectionPlatform,
    name: 'Plumbing Talk',
    handle: '@plumbing-talk',
    members: '8k members',
    description: 'Plumbers talking shop and homeowners asking for rescue.',
    url: 'https://x.com/search?q=plumbing&f=live',
    entryQuestions: [],
  },
  {
    id: 'reddit-plumbing',
    platform: 'reddit' satisfies ConnectionPlatform,
    name: 'r/Plumbing',
    handle: 'r/Plumbing',
    members: '890k members',
    description: '“Is this supposed to drip?” — asked daily, answered hourly.',
    url: 'https://reddit.com/r/Plumbing',
    entryQuestions: [],
  },
  {
    id: 'reddit-homeimprovement',
    platform: 'reddit' satisfies ConnectionPlatform,
    name: 'r/HomeImprovement',
    handle: 'r/HomeImprovement',
    members: '4.1m members',
    description: 'The biggest room-by-room repair crowd on the internet.',
    url: 'https://reddit.com/r/HomeImprovement',
    entryQuestions: [],
  },
  {
    id: 'reddit-dallas',
    platform: 'reddit' satisfies ConnectionPlatform,
    name: 'r/Dallas',
    handle: 'r/Dallas',
    members: '620k members',
    description: 'City-wide asks, including the weekly plumber thread.',
    url: 'https://reddit.com/r/Dallas',
    entryQuestions: [],
  },
]

/**
 * Seed for the join relation. `accepted` rows are current members; the one
 * `pending` row demonstrates the "waiting on the group to accept you" path
 * out of the box. The facebook joins are attributed to a connected mock
 * account so the community ↔ account relation has a value to show; reddit
 * joins carry no account.
 */
export const SEED_JOINED: Array<{ id: string; state: CommunityJoinState; accountId: string | null }> = [
  { id: 'facebook-dallas-homeowners', state: 'accepted', accountId: 'fb-galway-rubbish' },
  { id: 'facebook-texas-trades', state: 'pending', accountId: 'fb-galway-rubbish' },
  { id: 'reddit-plumbing', state: 'accepted', accountId: null },
]

export function resolveAccountLabel(accountId: string | null): string | null {
  if (!accountId) return null
  return MOCK_CONNECTIONS.find((account) => account.id === accountId)?.label ?? null
}

const FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.com',
  'www.fb.com',
  'm.fb.com',
])

export interface ParsedGroupUrl {
  /** Group slug or numeric id from the `/groups/<slug>` path segment. */
  slug: string
  /** Canonical `https://facebook.com/groups/<slug>` form for matching. */
  url: string
}

/**
 * Parse a pasted Facebook group link into its slug. Accepts scheme-less
 * input, mobile/web subdomains, fb.com short hosts, and trailing
 * path/query — anything that isn't `/groups/<slug>` on a facebook host
 * returns null so the form can flag it.
 */
export function parseFacebookGroupUrl(input: string): ParsedGroupUrl | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    return null
  }
  if (!FACEBOOK_HOSTS.has(parsed.hostname.toLowerCase())) return null
  const segments = parsed.pathname.split('/').filter((part) => part.length > 0)
  if (segments[0]?.toLowerCase() !== 'groups' || !segments[1]) return null
  const slug = segments[1]
  if (!/^[A-Za-z0-9._-]+$/.test(slug)) return null
  return { slug, url: `https://facebook.com/groups/${slug}` }
}

function titleFromSlug(slug: string): string {
  return slug
    .split(/[-_.]+/)
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export interface ParsedSubreddit {  /** Canonical `r/Name` handle (original casing kept for display). */
  name: string
  /** Lowercase key for catalog matching. */
  key: string
  /** Canonical `https://reddit.com/r/Name` link. */
  url: string
}

/**
 * Parse a typed subreddit into its canonical form. Accepts `r/Name`,
 * bare `Name`, and full `reddit.com/r/Name` links — anything else returns
 * null so the form can flag it.
 */
export function parseSubredditName(input: string): ParsedSubreddit | null {
  let trimmed = input.trim()
  if (!trimmed) return null
  const link = trimmed.match(/^(?:https?:\/\/)?(?:www\.|m\.|old\.)?reddit\.com\/r\/([A-Za-z0-9_]+)\/?(?:[?#].*)?$/)
  if (link?.[1]) trimmed = link[1]
  const bare = trimmed.match(/^(?:r\/)?([A-Za-z0-9_]+)$/)
  if (!bare?.[1]) return null
  const name = bare[1]
  return { name, key: name.toLowerCase(), url: `https://reddit.com/r/${name}` }
}

/**
 * Build a catalog row for a subreddit the mock hasn't seen before — the
 * stand-in for the client resolving an unknown community. Subreddits don't
 * gate entry, so resolved rows join immediately (accepted).
 */
export function communityFromSubreddit(parsed: ParsedSubreddit): {
  id: string
  platform: ConnectionPlatform
  name: string
  handle: string
  members: string
  description: string
  url: string
  entryQuestions: string[]
} {
  return {
    id: `reddit-link-${parsed.key}`,
    platform: 'reddit',
    name: `r/${parsed.name}`,
    handle: `r/${parsed.name}`,
    members: '—',
    description: 'Shared via subreddit name — resolved by the client.',
    url: parsed.url,
    entryQuestions: [],
  }
}

/**
 * Build a catalog row for a group link the mock hasn't seen before — the
 * stand-in for the facebook client resolving an unknown group URL. Details
 * stay sparse until the group accepts the request; entry questions fall
 * back to the generic gate every group asks.
 */
export function communityFromGroupUrl(parsed: ParsedGroupUrl): {
  id: string
  platform: ConnectionPlatform
  name: string
  handle: string
  members: string
  description: string
  url: string
  entryQuestions: string[]
} {
  const name = titleFromSlug(parsed.slug)
  return {
    id: `facebook-link-${parsed.slug.toLowerCase()}`,
    platform: 'facebook',
    name,
    handle: `@${parsed.slug.toLowerCase()}`,
    members: '—',
    description: 'Shared via group link — details load after the group accepts.',
    url: parsed.url,
    entryQuestions: [
      `Why do you want to join ${name}?`,
      'Do you agree to follow the group rules?',
    ],
  }
}