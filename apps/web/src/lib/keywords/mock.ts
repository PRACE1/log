import type { Keyword } from './types'

/**
 * Demo seed so the page reads populated, mirroring the listings MOCK rows.
 * Each seed carries the group relation it listens in — the facebook and
 * reddit keywords point at the communities the SEED_JOINED relation already
 * has joined, the X keyword carries no group. Ids are UUIDs: the analytics
 * view keys off them, so they must look like what the live client assigns.
 */
export const SEED_KEYWORDS: Keyword[] = [
  {
    id: 'b3f24a1e-7c5d-4f8a-9e2b-1a3c5d7e9f01',
    phrase: 'plumber needed',
    platform: 'facebook',
    status: 'listening',
    signalsCount: 14,
    addedAt: '2026-09-02T14:30:00.000Z',
    groupId: 'facebook-dallas-homeowners',
  },
  {
    id: 'c7d81e93-2b4f-4a6d-8c1e-5f9a3b7d2e44',
    phrase: 'handyman near me',
    platform: 'x',
    status: 'listening',
    signalsCount: 7,
    addedAt: '2026-09-05T09:12:00.000Z',
    groupId: null,
  },
  {
    id: 'e5a92c47-8d3b-4f1e-9a6c-2d8f4b6a1c93',
    phrase: 'house cleaning tips',
    platform: 'reddit',
    status: 'paused',
    signalsCount: 3,
    addedAt: '2026-09-09T18:45:00.000Z',
    groupId: 'reddit-plumbing',
  },
]

export function keywordId(): string {
  // Real UUIDs like the live client assigns — with a v4 fallback for
  // non-secure contexts where crypto.randomUUID is unavailable.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16)
    return (char === 'x' ? rand : (rand & 0x3) | 0x8).toString(16)
  })
}