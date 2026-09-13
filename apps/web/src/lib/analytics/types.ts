import type { ConnectionPlatform } from '../connections'

/** Raw signal kinds the firehose carries — the console filters on these. */
export type FirehoseEventType = 'mention' | 'question' | 'complaint' | 'praise'

export const FIREHOSE_EVENT_TYPES: FirehoseEventType[] = ['mention', 'question', 'complaint', 'praise']

export const FIREHOSE_TYPE_LABELS: Record<FirehoseEventType, string> = {
  mention: 'Mention',
  question: 'Question',
  complaint: 'Complaint',
  praise: 'Praise',
}

/** Per-event sentiment behind the little status dot in the console. */
export type EventSentiment = 'positive' | 'neutral' | 'negative'

export const EVENT_SENTIMENT_LABELS: Record<EventSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

/** One raw signal behind a keyword's numbers. Ids are UUIDs. */
export interface FirehoseEvent {
  id: string
  /** The keyword that captured this signal — rows link to its analytics. */
  keywordId: string
  ts: string
  type: FirehoseEventType
  sentiment: EventSentiment
  platform: ConnectionPlatform
  author: string
  group: string
  /** The connected account that captured this signal; null when unattributed. */
  accountId: string | null
  text: string
  /** Canonical post link — opened in a new tab from the console. */
  url: string
}

export interface SignalDay {
  date: string
  mentions: number
}

export interface PlatformSplit {
  platform: ConnectionPlatform
  mentions: number
}

export interface SentimentSlice {
  name: 'Positive' | 'Neutral' | 'Negative'
  value: number
}

/**
 * Everything the analytics view renders for one keyword, keyed by the
 * keyword UUID. Mocked deterministically from the id (stable across
 * refresh), standing in for the listening pipeline's aggregates.
 */
export interface KeywordAnalytics {
  keywordId: string
  totalMentions: number
  trend: SignalDay[]
  byPlatform: PlatformSplit[]
  sentiment: SentimentSlice[]
  /** Newest-first raw events backing the console firehose. */
  events: FirehoseEvent[]
  /** Full event count (the console caps what it renders). */
  eventTotal: number
}
