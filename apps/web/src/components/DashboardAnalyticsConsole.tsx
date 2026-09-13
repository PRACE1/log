import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AtSign, Frown, Globe, HelpCircle, Meh, Smile, ThumbsDown, ThumbsUp, Waves } from 'lucide-react'
import { Badge, useSquircleClip } from '@listeningkit/ui'
import {
  EVENT_SENTIMENT_LABELS,
  FIREHOSE_EVENT_TYPES,
  type EventSentiment,
  type FirehoseEvent,
  type FirehoseEventType,
} from '../lib/analytics'
import { getAccounts, platformLabel, type ConnectionRecord } from '../lib/connections'
import { accountIssueSnapshot } from '../lib/account-issues'
import { AccountHealthBadge } from './AccountHealthBadge'
import { SOCIAL_ICONS, SocialGlyph } from '../lib/social-icons'
import { highlightQuote } from './cards/QuoteHighlight'
import { DashboardTab, type DashboardTabAccent } from './DashboardTab'

// Type filters reuse the shared tab button: separate tab buttons with a
// squircle icon box left of the label. The active box carries the type's
// sentiment color so the All / Mention / Question / Complaint / Praise set
// reads how it filters.
const TYPE_FILTER_META: Record<
  'all' | FirehoseEventType,
  { label: string; icon: ReactNode; accent: DashboardTabAccent }
> = {
  all: {
    label: 'All',
    icon: <Globe className="size-4" aria-hidden="true" />,
    accent: 'blue',
  },
  mention: {
    label: 'Mention',
    icon: <AtSign className="size-4" aria-hidden="true" />,
    accent: 'sky',
  },
  question: {
    label: 'Question',
    icon: <HelpCircle className="size-4" aria-hidden="true" />,
    accent: 'amber',
  },
  complaint: {
    label: 'Complaint',
    icon: <ThumbsDown className="size-4" aria-hidden="true" />,
    accent: 'red',
  },
  praise: {
    label: 'Praise',
    icon: <ThumbsUp className="size-4" aria-hidden="true" />,
    accent: 'emerald',
  },
}

const SENTIMENT_BADGE: Record<EventSentiment, 'success' | 'muted' | 'danger'> = {
  positive: 'success',
  neutral: 'muted',
  negative: 'danger',
}

const SENTIMENT_ICON: Record<EventSentiment, ReactNode> = {
  positive: <Smile aria-hidden="true" className="size-3.5" />,
  neutral: <Meh aria-hidden="true" className="size-3.5" />,
  negative: <Frown aria-hidden="true" className="size-3.5" />,
}

const AVATAR_TINTS = ['#2A8CFF', '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E']

// The console never renders the whole firehose — it caps the list and says
// how much more the filter is hiding.
const RENDER_CAP = 50

function tintFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length]
}

function initialsFor(name: string): string {
  const clean = name.replace(/^@/, '')
  return clean.slice(0, 2).toUpperCase() || '?'
}

function formatTs(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Full-width raw firehose for a keyword: the actual events behind the
 * graphs, newest first, sliding into view in a white squircle card. A type
 * filter narrows the stream; the list caps at RENDER_CAP rows. Clicking a
 * row opens the analytics for the keyword the post was captured under.
 */
export function DashboardAnalyticsConsole({
events,
  phrases,
  fullText = false,
  onSelect
}: {
  events: FirehoseEvent[]
  /** Listened phrases to quote-highlight inside each event's text. */
  phrases: string[]
  /** Wrapped fuller text instead of the one-line truncated row. */
  fullText?: boolean
  /**
   * Row click override. Without it a row navigates to the keyword's
   * analytics; the per-keyword view passes the inspect-form opener instead
   * (you're already there — the row opens the post's context sheet).
   */
  onSelect?: (event: FirehoseEvent) => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | FirehoseEventType>('all')

  // The account that captured each event — the firehose stamps an accountId,
  // resolved through the accounts API once on mount (health badge per row).
  const [capturingAccounts, setCapturingAccounts] = useState<ConnectionRecord[]>([])
  useEffect(() => {
    let cancelled = false
    getAccounts()
      .then((list) => {
        if (!cancelled) setCapturingAccounts(list)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  const capturingById = useMemo(
    () => new Map(capturingAccounts.map((account) => [account.id, account])),
    [capturingAccounts]
  )

  const scoped = useMemo(
    () => (filter === 'all' ? events : events.filter((event) => event.type === filter)),
    [events, filter]
  )
  const visible = scoped.slice(0, RENDER_CAP)

  const filters: Array<'all' | FirehoseEventType> = ['all', ...FIREHOSE_EVENT_TYPES]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div ref={clip.ref} style={clip.style} className="bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2A8CFF] text-white"
            >
              <Waves className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Live firehose</h2>
              <p className="text-sm text-text-secondary">
                Raw signals behind the numbers — newest first.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by event type">
            {filters.map((option) => {
              const meta = TYPE_FILTER_META[option]
              return (
                <DashboardTab
                  key={option}
                  active={filter === option}
                  onClick={() => setFilter(option)}
                  label={meta.label}
                  icon={meta.icon}
                  accent={meta.accent}
                />
              )
            })}
          </div>
        </div>

        <div className="lk-no-scrollbar mt-4 flex max-h-80 min-h-0 flex-col gap-2 overflow-y-auto">
          {visible.map((event) => {
            const capturing = event.accountId ? capturingById.get(event.accountId) : undefined
            const platformIcon = SOCIAL_ICONS.find((icon) => icon.id === event.platform)
            return (
              <button
                type="button"
                key={event.id}
                onClick={() => (onSelect ? onSelect(event) : navigate(`/dashboard/analytics/${event.keywordId}`))}
                title={
                  onSelect
                    ? `Open the details of this post — ${event.author} · ${event.group}`
                    : `Open the keyword analytics this post was captured under — ${event.author} · ${event.group}`
                }
                className="flex w-full items-center gap-2.5 rounded-xl bg-black/[0.02] px-3 py-2 text-left transition-colors hover:bg-black/[0.05]"
              >
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: tintFor(event.author) }}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                >
                  {initialsFor(event.author)}
                </span>
                <span
                  className="max-w-[110px] shrink-0 truncate text-sm font-semibold text-text-primary"
                  title={event.author}
                >
                  {event.author}
                </span>
                <Badge
                  variant={SENTIMENT_BADGE[event.sentiment]}
                  title={EVENT_SENTIMENT_LABELS[event.sentiment]}
                  icon={SENTIMENT_ICON[event.sentiment]}
                  className="shrink-0"
                >
                  {EVENT_SENTIMENT_LABELS[event.sentiment]}
                </Badge>
                {capturing ? (
                  <AccountHealthBadge
                    label={capturing.label}
                    health={accountIssueSnapshot(capturing).health}
                    icon={platformIcon ? <SocialGlyph icon={platformIcon} className="size-3.5" /> : undefined}
                    className="shrink-0"
                  />
                ) : platformIcon ? (
                  <Badge
                    variant="brand"
                    title={platformLabel(event.platform)}
                    icon={<SocialGlyph icon={platformIcon} className="size-3.5" />}
                    className="shrink-0"
                  >
                    {platformLabel(event.platform)}
                  </Badge>
                ) : null}
                <p
                  className={
                    fullText
                      ? 'min-w-0 flex-1 whitespace-pre-line break-words text-sm text-text-primary'
                      : 'min-w-0 flex-1 truncate text-sm text-text-primary'
                  }
                  title={`${event.text} — ${event.author} · ${event.group}`}
                >
                  {highlightQuote(event.text, phrases)}
                </p>
                <span className="shrink-0 text-xs tabular-nums text-text-secondary">
                  {formatTs(event.ts)}
                </span>
              </button>
            )
          })}
          {visible.length === 0 ? (
            <p className="py-4 text-sm text-text-secondary">
              Nothing of this type in the stream — try another filter.
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
