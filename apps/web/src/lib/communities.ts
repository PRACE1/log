export interface Community {
  id: string
  platform: string
  name: string
  handle: string
  members: string
  description: string
}

export const COMMUNITIES: Community[] = [
  {
    id: 'facebook-dallas-homeowners',
    platform: 'facebook',
    name: 'Dallas Homeowners',
    handle: '@dallashomeowners',
    members: '48k members',
    description: 'Leaks, repairs and contractor referrals across Dallas–Fort Worth.',
  },
  {
    id: 'facebook-texas-trades',
    platform: 'facebook',
    name: 'Texas Trades Network',
    handle: '@texastrades',
    members: '12k members',
    description: 'Licensed tradespeople swapping jobs and advice across Texas.',
  },
  {
    id: 'facebook-diy-plumbing',
    platform: 'facebook',
    name: 'DIY Plumbing Help',
    handle: '@diyplumbing',
    members: '89k members',
    description: 'Homeowners posting photos of whatever just started leaking.',
  },
  {
    id: 'x-dallas-tx',
    platform: 'x',
    name: 'Dallas, TX',
    handle: '@dallas-tx',
    members: '210k members',
    description: 'Real-time local chatter — outages, storms and service calls.',
  },
  {
    id: 'x-home-improvement',
    platform: 'x',
    name: 'Home Improvement',
    handle: '@home-improvement',
    members: '1.2m members',
    description: 'Renovations, repairs and before-and-after threads.',
  },
  {
    id: 'x-plumbing-talk',
    platform: 'x',
    name: 'Plumbing Talk',
    handle: '@plumbing-talk',
    members: '8k members',
    description: 'Plumbers talking shop and homeowners asking for rescue.',
  },
  {
    id: 'reddit-plumbing',
    platform: 'reddit',
    name: 'r/Plumbing',
    handle: 'r/Plumbing',
    members: '890k members',
    description: '“Is this supposed to drip?” — asked daily, answered hourly.',
  },
  {
    id: 'reddit-homeimprovement',
    platform: 'reddit',
    name: 'r/HomeImprovement',
    handle: 'r/HomeImprovement',
    members: '4.1m members',
    description: 'The biggest room-by-room repair crowd on the internet.',
  },
  {
    id: 'reddit-dallas',
    platform: 'reddit',
    name: 'r/Dallas',
    handle: 'r/Dallas',
    members: '620k members',
    description: 'City-wide asks, including the weekly plumber thread.',
  },
]

const STORAGE_KEY = 'listeningkit.joined-communities.v1'
const DEFAULT_JOINED = ['reddit-plumbing', 'facebook-dallas-homeowners']

export function loadJoined(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return [...DEFAULT_JOINED]
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : [...DEFAULT_JOINED]
  } catch {
    return [...DEFAULT_JOINED]
  }
}

export function saveJoined(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore — membership still works for this session
  }
}
