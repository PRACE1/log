import { MOCK_CONNECTIONS, type ConnectionPlatform } from '../connections'
import type {
  EventSentiment,
  FirehoseEvent,
  FirehoseEventType,
  KeywordAnalytics,
  PlatformSplit,
  SentimentSlice,
  SignalDay,
} from './types'

export type { FirehoseEventType }

const PLATFORM_GROUPS: Record<ConnectionPlatform, string[]> = {
  facebook: ['Dallas Homeowners', 'Texas Trades Network', 'DIY Plumbing Help'],
  x: ['Dallas, TX', 'Home Improvement'],
  reddit: ['r/Plumbing', 'r/HomeImprovement', 'r/Dallas'],
}

const AUTHORS = [
  'galway_mam',
  'DIYDan__',
  'contractor_kate',
  'salthill_sam',
  'pipe_dreams',
  'fixit_felix',
  'moycullen_mary',
  'trade_tom',
]

const TEXTS: Record<FirehoseEventType, string[]> = {
  mention: [
    'Anyone dealt with {phrase} lately? Looking for pointers.',
    'Saw three threads about {phrase} this week alone.',
    'Adding {phrase} to the weekend job list.',
  ],
  question: [
    'Quick one — who do you call for {phrase}?',
    '{phrase} — DIY or call someone? What did it cost you?',
    'Is {phrase} supposed to take all day?',
  ],
  complaint: [
    'Still waiting on someone for {phrase} — third no-show this month.',
    'Quoted double for {phrase} what my neighbour paid. Fuming.',
    '{phrase} has flooded the utility room. Again.',
  ],
  praise: [
    'Shoutout to the crew who sorted {phrase} in one visit. Legends.',
    '{phrase} done and dusted — half the quote I feared.',
    'Recommendations for {phrase} paid off, spotless work.',
  ],
}

const EVENT_TYPES: FirehoseEventType[] = ['mention', 'question', 'complaint', 'praise']

// Deterministic PRNG (mulberry32) off a string hash — the same keyword UUID
// always yields the same numbers, so refreshes read stable.
function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dayLabel(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function eventTime(rand: () => number): string {
  // Sometime in the last 14 days.
  const date = new Date(Date.now() - Math.floor(rand() * 14 * 24 * 60 * 60 * 1000))
  return date.toISOString()
}

// Weighted sentiment per event kind — deterministic through the seeded rand.
function sentimentFor(type: FirehoseEventType, rand: () => number): EventSentiment {
  const roll = rand()
  switch (type) {
    case 'complaint':
      return roll < 0.85 ? 'negative' : roll < 0.95 ? 'neutral' : 'positive'
    case 'praise':
      return roll < 0.85 ? 'positive' : roll < 0.95 ? 'neutral' : 'negative'
    case 'question':
      return roll < 0.7 ? 'neutral' : roll < 0.9 ? 'positive' : 'negative'
    default:
      return roll < 0.8 ? 'neutral' : roll < 0.9 ? 'positive' : 'negative'
  }
}

function eventUrl(platform: ConnectionPlatform, author: string, group: string, index: number): string {
  const seq = (index * 7919 + 104729).toString(36)
  if (platform === 'x') return `https://x.com/${author}/status/${seq}`
  if (platform === 'reddit') return `https://reddit.com/${group}/comments/${seq}`
  const slug = group.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `https://facebook.com/groups/${slug}/posts/${seq}`
}

/**
 * Mocked aggregates + firehose for one keyword UUID, scoped to the keyword's
 * platform — a facebook-scoped keyword only ever sees facebook signals.
 * Shape mirrors what the listening pipeline will return; content is
 * generated, so counts and copy differ per keyword while the structure
 * never does.
 */
export function getKeywordAnalytics(
  keywordId: string,
  phrase: string,
  platform: ConnectionPlatform
): KeywordAnalytics {
  const rand = mulberry32(hashSeed(keywordId || 'fallback'))

  const trend: SignalDay[] = Array.from({ length: 14 }, (_, index) => {
    const daysAgo = 13 - index
    const wave = Math.sin((index / 13) * Math.PI * 2) * 0.5 + 0.5
    return {
      date: dayLabel(daysAgo),
      mentions: Math.max(0, Math.round(4 + wave * 14 + rand() * 8)),
    }
  })
  const totalMentions = trend.reduce((sum, day) => sum + day.mentions, 0)

  const byPlatform: PlatformSplit[] = [{ platform, mentions: totalMentions }]

  const EVENT_COUNT = 120
  // Which connected account on the platform captured each signal — the live
  // pipeline stamps this the moment a reader hands the post over.
  const platformAccounts = MOCK_CONNECTIONS.filter((account) => account.platform === platform)
  const events: FirehoseEvent[] = Array.from({ length: EVENT_COUNT }, (_, index) => {
    const type = EVENT_TYPES[Math.floor(rand() * EVENT_TYPES.length)]
    const groups = PLATFORM_GROUPS[platform]
    const templates = TEXTS[type]
    const author = AUTHORS[Math.floor(rand() * AUTHORS.length)]
    const group = groups[Math.floor(rand() * groups.length)]
    const account = platformAccounts[Math.floor(rand() * platformAccounts.length)]
    return {
      id: `${keywordId.slice(0, 8)}-${String(index).padStart(4, '0')}-4e2a-9b1c-${String(index * 7919).padStart(12, '0').slice(-12)}`,
      keywordId,
      ts: eventTime(rand),
      type,
      sentiment: sentimentFor(type, rand),
      platform,
      author,
      group,
      accountId: account ? account.id : null,
      text: templates[Math.floor(rand() * templates.length)].replace(/\{phrase\}/g, phrase),
      url: eventUrl(platform, author, group, index),
    }
  }).sort((a, b) => (a.ts < b.ts ? 1 : -1))

  // Sentiment aggregates the scoped events themselves, so the donut always
  // agrees with the firehose below it.
  const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 }
  for (const event of events) {
    if (event.sentiment === 'positive') sentimentCounts.Positive += 1
    else if (event.sentiment === 'negative') sentimentCounts.Negative += 1
    else sentimentCounts.Neutral += 1
  }
  const positiveShare = Math.round((sentimentCounts.Positive / EVENT_COUNT) * 100)
  const negativeShare = Math.round((sentimentCounts.Negative / EVENT_COUNT) * 100)
  const sentiment: SentimentSlice[] = [
    { name: 'Positive', value: positiveShare },
    { name: 'Neutral', value: Math.max(0, 100 - positiveShare - negativeShare) },
    { name: 'Negative', value: negativeShare },
  ]

  return { keywordId, totalMentions, trend, byPlatform, sentiment, events, eventTotal: EVENT_COUNT }
}
