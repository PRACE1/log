import { useEffect, useState } from 'react'
import { Badge } from '@listeningkit/ui'
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Flame,
  Lightbulb,
  MapPin,
  MessageSquareText,
  PenLine,
  SearchIcon,
  SlidersHorizontal,
  TrendingUp,
  Zap
} from 'lucide-react'
import {
  EVENT_SENTIMENT_LABELS,
  FIREHOSE_TYPE_LABELS,
  type EventSentiment,
  type FirehoseEvent,
  type FirehoseEventType
} from '../lib/analytics'
import { accountIssueSnapshot } from '../lib/account-issues'
import { getAccounts, type ConnectionRecord } from '../lib/connections'
import { SOCIAL_ICONS, SocialGlyph } from '../lib/social-icons'
import { AccountHealthBadge } from './AccountHealthBadge'
import { DashboardFormSheet } from './DashboardFormSheet'
import { FacebookPostText } from './cards/FacebookCard'
import { CARD_NATURAL_WIDTHS, FeedCardFrame } from './cards/FeedCardFrame'
import { RedditPostText } from './cards/RedditCard'
import { TwitterPostText } from './cards/TwitterCard'
import Dither from './Dither'

const SENTIMENT_BADGE: Record<EventSentiment, 'success' | 'muted' | 'danger'> = {
  positive: 'success',
  neutral: 'muted',
  negative: 'danger'
}

const AI_SUMMARY_BY_TYPE: Record<FirehoseEventType, string> = {
  mention: 'This post signals casual brand awareness rather than an active need. Low urgency, but worth tracking if the volume keeps climbing.',
  question: 'This post signals growing interest in finding a reliable option nearby. The repeated discussion suggests a clear service opportunity.',
  complaint: 'This post signals rising support friction. The tone suggests the issue is compounding and worth escalating quickly.',
  praise: 'This post signals genuine advocacy. The enthusiasm here makes it a strong candidate for a review or testimonial ask.'
}

type AiTagTone = 'red' | 'blue' | 'purple' | 'green'

const AI_TAG_TONE_STYLES: Record<AiTagTone, string> = {
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-violet-50 text-violet-600',
  green: 'bg-emerald-50 text-emerald-600'
}

const AI_TAGS_BY_TYPE: Record<FirehoseEventType, { label: string; icon: typeof Flame; tone: AiTagTone }[]> = {
  mention: [
    { label: 'Awareness', icon: Flame, tone: 'red' },
    { label: 'Local', icon: MapPin, tone: 'blue' }
  ],
  question: [
    { label: 'High intent', icon: Flame, tone: 'red' },
    { label: 'Local', icon: MapPin, tone: 'blue' },
    { label: 'Trending', icon: TrendingUp, tone: 'purple' },
    { label: 'Opportunity', icon: Zap, tone: 'green' }
  ],
  complaint: [
    { label: 'Urgent', icon: Flame, tone: 'red' },
    { label: 'Support risk', icon: MapPin, tone: 'blue' }
  ],
  praise: [
    { label: 'Advocacy', icon: Flame, tone: 'red' },
    { label: 'Opportunity', icon: Zap, tone: 'green' }
  ]
}

const AI_NEXT_ACTIONS = [
  { label: 'Find related mentions', icon: SearchIcon },
  { label: 'Draft a response', icon: MessageSquareText },
  { label: 'Create content', icon: PenLine }
] as const

function formatTs(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/** Stable per-event engagement stat in [min, max]. */
function statFor(id: string, salt: string, min: number, max: number): number {
  let hash = 0
  const input = `${id}:${salt}`
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0
  return min + (Math.abs(hash) % (max - min + 1))
}

function handleFor(name: string): string {
  const cleaned = name.replace(/^@/, '').replace(/[^a-zA-Z0-9]/g, '')
  return cleaned ? `@${cleaned}` : '@user'
}

function AiTagPill({ label, icon: Icon, tone }: { label: string; icon: typeof Flame; tone: AiTagTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${AI_TAG_TONE_STYLES[tone]}`}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}

function AiNextActionRow({ label, icon: Icon }: { label: string; icon: typeof SearchIcon }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-[#2A8CFF] transition-colors hover:bg-slate-100"
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-slate-400" />
    </button>
  )
}

/**
 * The inspect view for one captured post: the post itself rendered as its
 * native platform card with the heard phrase drawn in the blue dashed quotes,
 * and the capturing account badge in the sheet header. The original link is
 * the confirm. Registered into the dashboard form slot from the per-keyword
 * analytics page, docking in the layout's form column without reflow.
 */
export function DashboardEventInspectForm({
  event,
  phrases,
  onClose
}: {
  event: FirehoseEvent
  /** Listened phrases to highlight inside the post and its surroundings. */
  phrases?: string[]
  onClose: () => void
}) {
  const [capturing, setCapturing] = useState<ConnectionRecord | null | undefined>(undefined)

  useEffect(() => {
    if (!event.accountId) {
      setCapturing(null)
      return
    }
    let cancelled = false
    getAccounts()
      .then((list) => {
        if (cancelled) return
        setCapturing(list.find((row) => row.id === event.accountId) ?? null)
      })
      .catch(() => {
        if (!cancelled) setCapturing(null)
      })
    return () => {
      cancelled = true
    }
  }, [event.accountId])

  const platformIcon = SOCIAL_ICONS.find((icon) => icon.id === event.platform)

  return (
    <DashboardFormSheet
      open
      title={FIREHOSE_TYPE_LABELS[event.type]}
      subtitle={
        <>
          <span>{formatTs(event.ts)}</span>
          {capturing === undefined ? (
            <span aria-busy="true">Loading account…</span>
          ) : capturing ? (
            <AccountHealthBadge
              label={capturing.label}
              health={accountIssueSnapshot(capturing).health}
              icon={platformIcon ? <SocialGlyph icon={platformIcon} className="size-3.5" /> : undefined}
            />
          ) : (
            <span>Not attributed to a connected account.</span>
          )}
        </>
      }
      onClose={onClose}
      confirmLabel="Open original post"
      onConfirm={() => window.open(event.url, '_blank', 'noopener,noreferrer')}
    >
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1E66C9] bg-[#2A8CFF] px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white">
          The post
        </p>
        <Badge variant={SENTIMENT_BADGE[event.sentiment]} className="shrink-0">
          {EVENT_SENTIMENT_LABELS[event.sentiment]}
        </Badge>
      </div>
      <div className="relative rounded-xl p-4">
        <div className="pointer-events-none absolute inset-0">
          <Dither
            waveColor={[0.3, 0.65, 1]}
            backgroundColor={[0.04, 0.24, 0.57]}
            waveSpeed={0.08}
            colorNum={4}
            pixelSize={3}
            enableMouseInteraction={false}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              'linear-gradient(to right, #fff 0%, rgba(255,255,255,0) 14%, rgba(255,255,255,0) 86%, #fff 100%)',
              'linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, #fff 100%)'
            ].join(', ')
          }}
        />
        <div className="relative">
          {event.platform === 'facebook' ? (
            <FeedCardFrame naturalWidth={CARD_NATURAL_WIDTHS.facebook}>
              <FacebookPostText
                authorName={event.author}
                timeAgo={timeAgo(event.ts)}
                lines={[event.text]}
                likes={String(statFor(event.id, 'likes', 2, 87))}
                comments={`${statFor(event.id, 'comments', 0, 24)} comments`}
                shares={`${statFor(event.id, 'shares', 0, 12)} shares`}
                highlight={phrases}
              />
            </FeedCardFrame>
          ) : event.platform === 'x' ? (
            <FeedCardFrame naturalWidth={CARD_NATURAL_WIDTHS.x}>
              <TwitterPostText
                authorName={event.author}
                handle={handleFor(event.author)}
                body={event.text}
                timestamp={formatTs(event.ts)}
                views={String(statFor(event.id, 'views', 12, 9400))}
                replies={String(statFor(event.id, 'replies', 0, 18))}
                reposts={String(statFor(event.id, 'reposts', 0, 30))}
                likes={String(statFor(event.id, 'likes', 1, 120))}
                highlight={phrases}
              />
            </FeedCardFrame>
          ) : (
            <FeedCardFrame naturalWidth={CARD_NATURAL_WIDTHS.reddit}>
              <RedditPostText
                communityName={event.group}
                title={event.text}
                likes={String(statFor(event.id, 'upvotes', 3, 400))}
                shares={String(statFor(event.id, 'comments', 1, 60))}
                highlight={phrases}
              />
            </FeedCardFrame>
          )}
        </div>
      </div>
      <div className="bg-white">
        <div className="flex items-center gap-2 rounded-t-xl border border-slate-200 bg-[#EAF3FF] px-3 py-2.5">
          <Brain className="size-4 shrink-0 text-[#2A8CFF]" />
          <span className="text-xs font-semibold text-[#0B3E91]">AI Analysis</span>
          <span className="rounded-full bg-[#2A8CFF] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
            beta
          </span>
          <span className="ml-auto flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-400">
            <SlidersHorizontal className="size-3" />
            Sentiment
            <ChevronDown className="size-3" />
          </span>
        </div>
        <div className="space-y-4 px-3 py-3">
          <p className="text-sm leading-relaxed text-slate-700">{AI_SUMMARY_BY_TYPE[event.type]}</p>
          <div className="flex flex-wrap gap-2">
            {AI_TAGS_BY_TYPE[event.type].map((tag) => (
              <AiTagPill key={tag.label} label={tag.label} icon={tag.icon} tone={tag.tone} />
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Lightbulb className="size-3.5 shrink-0 text-[#2A8CFF]" />
              <span className="text-xs font-semibold text-slate-700">What next?</span>
            </div>
            <div className="space-y-1.5">
              {AI_NEXT_ACTIONS.map((action) => (
                <AiNextActionRow key={action.label} label={action.label} icon={action.icon} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardFormSheet>
  )
}	