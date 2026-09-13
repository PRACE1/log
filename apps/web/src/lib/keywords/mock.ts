import type { Keyword } from './types'

/**
 * Demo seed so the page reads populated, mirroring the listings MOCK rows.
 * Each seed carries the group relation it listens in — the facebook and
 * reddit keywords point at the communities the SEED_JOINED relation already
 * has joined, the X keyword carries no group.
 */
export const SEED_KEYWORDS: Keyword[] = [
  {
    id: 'keyword-seed-plumber',
    phrase: 'plumber needed',
    platform: 'facebook',
    status: 'listening',
    signalsCount: 14,
    addedAt: '2026-09-02T14:30:00.000Z',
    groupId: 'facebook-dallas-homeowners',
  },
  {
    id: 'keyword-seed-handyman',
    phrase: 'handyman near me',
    platform: 'x',
    status: 'listening',
    signalsCount: 7,
    addedAt: '2026-09-05T09:12:00.000Z',
    groupId: null,
  },
  {
    id: 'keyword-seed-cleaning',
    phrase: 'house cleaning tips',
    platform: 'reddit',
    status: 'paused',
    signalsCount: 3,
    addedAt: '2026-09-09T18:45:00.000Z',
    groupId: 'reddit-plumbing',
  },
]

export function keywordId(): string {
  return `keyword-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}