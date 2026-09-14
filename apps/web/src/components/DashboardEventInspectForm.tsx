import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@listeningkit/ui'
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  Lightbulb,
  MapPin,
  MessageSquareText,
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
import { getCommunities } from '../lib/communities'
import { createKeyword } from '../lib/keywords'
import { getBrand, type AiQuery } from '../lib/brand'
import { buildAiQuery, draftReply, suggestKeywords } from '../lib/brand/query'
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
  { id: 'related', label: 'Find related mentions', icon: SearchIcon },
  { id: 'reply', label: 'Draft a response', icon: MessageSquareText }
] as const

type AiFollowUpId = (typeof AI_NEXT_ACTIONS)[number]['id']

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

function AiNextActionRow({
  label,
  icon: Icon,
  expanded,
  onClick
}: {
  label: string
  icon: typeof SearchIcon
  expanded: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-[#2A8CFF] transition-colors hover:bg-slate-100"
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight
        className={`size-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
      />
    </button>
  )
}

/**
 * "Find related mentions": candidate keyword phrases pulled from the post
 * text (minus what's already tracked). Accepting one saves it as a real
 * listening keyword — X keywords are word-scoped, facebook/reddit ones ride
 * on the first joined community for the platform.
 */
function RelatedMentionsPanel({ query, event }: { query: AiQuery; event: FirehoseEvent }) {
  const suggestions = useMemo(() => suggestKeywords(event, query.trackedPhrases), [event, query.trackedPhrases])
  const [saved, setSaved] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [custom, setCustom] = useState('')

  async function acceptPhrase(raw: string) {
    const phrase = raw.trim()
    if (!phrase || busy) return
    const key = phrase.toLowerCase()
    if (saved.includes(key)) return
    setBusy(phrase)
    setError(null)
    try {
      let groupId: string | null = null
      if (event.platform !== 'x') {
        const communities = await getCommunities({ platform: event.platform })
        const joined = communities.find((community) => community.joinState === 'accepted')
        if (!joined) {
          throw new Error(
            `Join a group on this platform first — ${event.platform === 'facebook' ? 'Facebook' : 'Reddit'} keywords need a group to listen in.`
          )
        }
        groupId = joined.id
      }
      await createKeyword({ phrase, platform: event.platform, groupId })
      setSaved((prev) => [...prev, key])
      setCustom('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that keyword.')
    } finally {
      setBusy(null)
    }
  }

  const remaining = suggestions.filter((phrase) => !saved.includes(phrase.toLowerCase()))

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-xs font-semibold text-slate-700">Suggested keywords from this post</p>
      {remaining.length === 0 ? (
        <p className="mt-1.5 text-sm text-slate-500">
          {saved.length > 0 ? 'All suggestions saved — add your own below.' : 'Nothing new in this post — try another event.'}
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {remaining.map((phrase) => (
            <li key={phrase} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
              <span className="flex-1 font-medium text-slate-800">“{phrase}”</span>
              <button
                type="button"
                onClick={() => acceptPhrase(phrase)}
                disabled={busy !== null}
                className="shrink-0 rounded-md bg-[#2A8CFF] px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-[#1E66C9] disabled:opacity-50"
              >
                {busy === phrase ? 'Saving…' : 'Accept'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {saved.length > 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <Check className="size-3.5" />
          {saved.length} saved — now listening
        </p>
      ) : null}
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          acceptPhrase(custom)
        }}
      >
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add your own keyword"
          aria-label="Add your own keyword"
          className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2A8CFF] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!custom.trim() || busy !== null}
          className="h-9 shrink-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  )
}

/**
 * "Draft a response": the event answered in the brand's voice, previewed in
 * the post's own native card as the reply. Accept sends it (mock), or write
 * your own and send that instead.
 */
function ReplyDraftPanel({ query, event }: { query: AiQuery; event: FirehoseEvent }) {
  const draft = useMemo(() => draftReply(query), [query])
  const [mode, setMode] = useState<'preview' | 'editing' | 'sent'>('preview')
  const [body, setBody] = useState(draft)

  useEffect(() => {
    setBody(draft)
    setMode('preview')
  }, [draft])

  const brandName = query.brand?.identity.name ?? 'Your business'

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-xs font-semibold text-slate-700">Reply preview</p>
      {mode === 'sent' ? (
        <div className="rounded-lg bg-white p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-600">
            <Check className="size-4" />
            Reply sent (mock)
          </p>
          <p className="mt-1 text-xs text-slate-500">The live client will post it to {event.platform}.</p>
          <button
            type="button"
            onClick={() => setMode('editing')}
            className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Write another
          </button>
        </div>
      ) : mode === 'editing' ? (
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            aria-label="Your reply"
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800 focus:border-[#2A8CFF] focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('sent')}
              disabled={!body.trim()}
              className="flex-1 rounded-lg bg-[#2A8CFF] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1E66C9] disabled:opacity-50"
            >
              Send reply
            </button>
            <button
              type="button"
              onClick={() => {
                setBody(draft)
                setMode('preview')
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-xl bg-white p-3">
            {event.platform === 'facebook' ? (
              <FeedCardFrame naturalWidth={CARD_NATURAL_WIDTHS.facebook}>
                <FacebookPostText
                  authorName={brandName}
                  timeAgo="now"
                  lines={[body]}
                  likes="0"
                  comments="0 comments"
                  shares="0 shares"
                />
              </FeedCardFrame>
            ) : event.platform === 'x' ? (
              <FeedCardFrame naturalWidth={CARD_NATURAL_WIDTHS.x}>
                <TwitterPostText
                  authorName={brandName}
                  handle={handleFor(brandName)}
                  body={body}
                  timestamp="now"
                  views="0"
                  replies="0"
                  reposts="0"
                  likes="0"
                />
              </FeedCardFrame>
            ) : (
              <FeedCardFrame naturalWidth={CARD_NATURAL_WIDTHS.reddit}>
                <RedditPostText communityName={event.group} title={body} likes="0" shares="0 comments" />
              </FeedCardFrame>
            )}
          </div>
          {!query.brand ? (
            <p className="text-xs text-slate-500">
              No brand profile yet — add your website in onboarding for voice-matched drafts.
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('sent')}
              className="flex-1 rounded-lg bg-[#2A8CFF] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1E66C9]"
            >
              Accept reply
            </button>
            <button
              type="button"
              onClick={() => setMode('editing')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Write your own
            </button>
          </div>
        </div>
      )}
    </div>
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

  const [openAction, setOpenAction] = useState<AiFollowUpId | null>(null)
  // Brand snapshot per event: later onboarding edits can't shift a draft mid-read.
  const brandSnapshot = useMemo(() => getBrand(), [event.id])
  const query = useMemo(
    () => (openAction ? buildAiQuery(openAction, event, brandSnapshot, phrases ?? []) : null),
    [openAction, event, brandSnapshot, phrases]
  )

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
                <AiNextActionRow
                  key={action.id}
                  label={action.label}
                  icon={action.icon}
                  expanded={openAction === action.id}
                  onClick={() => setOpenAction((prev) => (prev === action.id ? null : action.id))}
                />
              ))}
            </div>
            {query ? (
              query.action === 'related' ? (
                <RelatedMentionsPanel query={query} event={event} />
              ) : (
                <ReplyDraftPanel query={query} event={event} />
              )
            ) : null}
          </div>
        </div>
      </div>
    </DashboardFormSheet>
  )
}	