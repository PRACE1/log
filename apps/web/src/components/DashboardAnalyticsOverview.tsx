import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { getKeywords, type Keyword } from '../lib/keywords'
import { getKeywordAnalytics } from '../lib/analytics'
import { type ConnectionPlatform } from '../lib/connections'
import { SOCIAL_ICONS, SocialGlyph } from '../lib/social-icons'
import { DashboardAnalyticsConsole } from './DashboardAnalyticsConsole'

/**
 * Analytics landing: just the firehose across every listening keyword, with
 * the social logos up top scoping the stream per platform. Tracked-words
 * count up front; rows render fuller text than the per-keyword console.
 */
export function DashboardAnalyticsOverview() {
  const [keywords, setKeywords] = useState<Keyword[] | null>(null)
  const [platform, setPlatform] = useState<'all' | ConnectionPlatform>('all')

  useEffect(() => {
    let cancelled = false
    getKeywords()
      .then((list) => {
        if (!cancelled) setKeywords(list)
      })
      .catch(() => {
        if (!cancelled) setKeywords([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const listening = useMemo(
    () => (keywords ?? []).filter((keyword) => keyword.status === 'listening'),
    [keywords]
  )
  const phrases = useMemo(() => listening.map((keyword) => keyword.phrase), [listening])

  const { events } = useMemo(() => {
    const all = listening
      .flatMap((keyword) => getKeywordAnalytics(keyword.id, keyword.phrase, keyword.platform).events)
      .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    const scoped = platform === 'all' ? all : all.filter((event) => event.platform === platform)
    return { events: scoped, total: scoped.length }
  }, [listening, platform])

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary">
            {keywords === null
              ? 'Loading analytics…'
              : `Tracking ${listening.length} word${listening.length === 1 ? '' : 's'} across the firehose.`}
          </p>
        </div>
        <div
          className="flex h-9 items-center gap-0.5 rounded-lg border border-black/10 bg-white p-0.5"
          role="group"
          aria-label="Filter by platform"
        >
          <button
            type="button"
            onClick={() => setPlatform('all')}
            aria-pressed={platform === 'all'}
            className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors ${
              platform === 'all' ? 'bg-[#2A8CFF] text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Globe className="size-3.5" aria-hidden="true" />
            All
          </button>
          {SOCIAL_ICONS.map((icon) => {
            const active = platform === icon.id
            return (
              <button
                key={icon.id}
                type="button"
                onClick={() => setPlatform(icon.id as ConnectionPlatform)}
                aria-pressed={active}
                className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-[#2A8CFF] text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <SocialGlyph icon={icon} className="size-3.5" aria-hidden="true" />
                {icon.label}
              </button>
            )
          })}
        </div>
      </div>

      {keywords === null ? (
        <p className="rounded-xl bg-black/5 p-4 text-sm text-text-secondary" aria-busy="true">
          Loading the firehose…
        </p>
      ) : listening.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          Nothing listening yet —{' '}
          <Link to="/dashboard/keywords" className="font-semibold text-[#2A8CFF] hover:underline">
            add a keyword
          </Link>{' '}
          to fill the firehose.
        </p>
      ) : (
        <DashboardAnalyticsConsole events={events} phrases={phrases} fullText />
      )}
    </div>
  )
}
