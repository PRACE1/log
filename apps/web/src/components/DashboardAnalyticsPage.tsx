import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@listeningkit/ui'
import { getKeywords, type Keyword } from '../lib/keywords'
import { getKeywordAnalytics, type FirehoseEvent } from '../lib/analytics'
import { platformLabel } from '../lib/connections'
import { SOCIAL_ICONS, SocialGlyph } from '../lib/social-icons'
import { DashboardAnalytics } from './DashboardAnalytics'
import { DashboardAnalyticsConsole } from './DashboardAnalyticsConsole'
import { DashboardEventInspectForm } from './DashboardEventInspectForm'
import { useDashboardFormSlot } from './DashboardFormSlot'

/**
 * Header meta row: platform badge with its logo plus the status badge. The
 * keyword UUID stays in the route and the data flow — it never renders as
 * a cryptic fragment here.
 */
function AnalyticsMeta({ keyword }: { keyword: Keyword }) {
  const platformIcon = SOCIAL_ICONS.find((icon) => icon.id === keyword.platform)
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      {platformIcon ? (
        <Badge
          variant="brand"
          title={platformLabel(keyword.platform)}
          icon={<SocialGlyph icon={platformIcon} className="size-3.5" />}
        >
          {platformLabel(keyword.platform)}
        </Badge>
      ) : null}
      <Badge variant={keyword.status === 'listening' ? 'success' : 'muted'} dot={keyword.status === 'listening'}>
        {keyword.status === 'listening' ? 'Listening' : 'Paused'}
      </Badge>
    </div>
  )
}
/**
 * Per-keyword analytics, keyed by the keyword UUID in the route
 * (`/dashboard/analytics/:keywordId`). Row one is the three-graph summary,
 * row two the full-width firehose console — both read the same mocked
 * aggregate for the id.
 */
export function DashboardAnalyticsPage() {
  const { keywordId } = useParams()
  const setFormSlot = useDashboardFormSlot()
  const [keyword, setKeyword] = useState<Keyword | null | undefined>(undefined)
  const [inspectedEvent, setInspectedEvent] = useState<FirehoseEvent | null>(null)

  useEffect(() => {
    let cancelled = false
    getKeywords()
      .then((list) => {
        if (!cancelled) setKeyword(list.find((row) => row.id === keywordId) ?? null)
      })
      .catch(() => {
        if (!cancelled) setKeyword(null)
      })
    return () => {
      cancelled = true
    }
  }, [keywordId])

  // The post inspect form docks in the dashboard form slot — a row here has
  // no analytics page to navigate to (it's already this keyword's), so it
  // opens the sheet over the content instead.
  useEffect(() => {
    setFormSlot(
      inspectedEvent ? (
          <DashboardEventInspectForm
            event={inspectedEvent}
            phrases={[keyword?.phrase ?? '']}
            onClose={() => setInspectedEvent(null)}
          />
        ) : null
    )
    return () => setFormSlot(null)
  }, [inspectedEvent, keyword, setFormSlot])

  const analytics = useMemo(
    () => (keyword ? getKeywordAnalytics(keyword.id, keyword.phrase, keyword.platform) : null),
    [keyword]
  )

  if (keyword === undefined) {
    return (
      <div className="flex flex-col gap-6 pb-6">
        <p className="rounded-xl bg-black/5 p-4 text-sm text-text-secondary" aria-busy="true">
          Loading analytics…
        </p>
      </div>
    )
  }

  if (keyword === null || analytics === null) {    return (
      <div className="flex flex-col gap-6 pb-6">
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          That keyword doesn&apos;t exist in this workspace.{' '}
          <Link to="/dashboard/keywords" className="font-semibold text-[#2A8CFF] hover:underline">
            Back to keywords
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div>
        <Link
          to="/dashboard/keywords"
          className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={15} strokeWidth={2.25} aria-hidden="true" />
          Keywords
        </Link>
        <h1 className="mt-1 truncate text-3xl font-bold text-text-primary" title={`“${keyword.phrase}”`}>
          “{keyword.phrase}”
        </h1>
        <AnalyticsMeta keyword={keyword} />
      </div>

      <DashboardAnalytics keywordId={keyword.id} phrase={keyword.phrase} platform={keyword.platform} />
      <DashboardAnalyticsConsole events={analytics.events} phrases={[keyword.phrase]} onSelect={setInspectedEvent} />
    </div>
  )
}
