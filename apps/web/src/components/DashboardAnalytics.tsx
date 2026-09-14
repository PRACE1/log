import { useMemo, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Info } from 'lucide-react'
import { Badge, useSquircleClip } from '@listeningkit/ui'
import { FIREHOSE_TYPE_LABELS, getKeywordAnalytics } from '../lib/analytics'
import { type ConnectionPlatform } from '../lib/connections'

// Custom single-hue board derived from the brand blue (#2A8CFF), per the
// lieflat custom-board rule: one hero hue, mids/pales mixed toward BG/TXT.
// Ordinal logic — darkest = most important — so ranked bars read darkest-first.
const HERO = '#2A8CFF'
const DEEP = '#0B3B8F'
const MID = '#6FA8F5'
const SOFT = '#9DC2F7'
const PALE = '#D3E5FA'
const GRID = '#E4E7EC'
const TICK = '#64748B'

// Rank-ordered ramp for countable rows: most mentions goes darkest.
const ROW_RAMP = [DEEP, HERO, MID, PALE]
// Sentiment keeps the same hue (blue scheme locked) — labels carry the
// positive/neutral/negative meaning so color is never the only clue.
const SENTIMENT_COLORS = [HERO, SOFT, PALE]

function ChartCard({
  title,
  metric,
  info,
  infoVisual,
  children,
}: {
  title: string
  metric: string
  /** How-to-read note — shown in a hover tooltip on the info icon, not as a caption. */
  info: string
  /** Minified visual that illustrates what the card's chart is showing. */
  infoVisual?: ReactNode
  children: ReactNode
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  return (
    <div ref={clip.ref} style={clip.style} className="flex flex-col gap-1 bg-white p-5">
      <p>
        <Badge variant="brand">{title}</Badge>
      </p>
      <p className="flex items-center gap-1.5">
        <span
          className="text-2xl tabular-nums"
          style={{ fontFamily: "'Satoshi', Inter, system-ui, sans-serif", fontWeight: 900, color: '#0B0B0C' }}
        >
          {metric}
        </span>
        <span
          className="group relative flex size-7 shrink-0 items-center justify-center rounded-xl bg-black/5"
          title={info}
        >
          <Info size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
          <span className="sr-only">{info}</span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-56 items-center gap-2 rounded-lg bg-text-primary p-2 text-xs font-medium normal-case leading-snug text-white shadow-lg group-hover:flex"
          >
            {infoVisual ? (
              <span className="flex shrink-0 items-center justify-center rounded-md bg-white/10 p-1.5">
                {infoVisual}
              </span>
            ) : null}
            <span>{info}</span>
          </span>
        </span>
      </p>
      <div className="mt-3 h-56">{children}</div>
    </div>
  )
}

/** Minified trend line for the mentions tooltip — area + dots, brand blue. */
function MiniTrend() {
  return (
    <svg width="64" height="30" viewBox="0 0 64 30" aria-hidden="true">
      <polygon points="0,24 10,19 20,21 30,13 40,15 50,8 64,10 64,30 0,30" fill={HERO} opacity="0.3" />
      <polyline
        points="0,24 10,19 20,21 30,13 40,15 50,8 64,10"
        fill="none"
        stroke={HERO}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="8" r="2.5" fill="#fff" />
    </svg>
  )
}

/** Minified ranked rows for the signal-mix tooltip — darkest first. */
function MiniRows() {
  const widths = [56, 42, 30, 20]
  return (
    <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden="true">
      {widths.map((width, index) => (
        <rect
          key={index}
          x="0"
          y={index * 10}
          width={width}
          height="7"
          rx="3.5"
          fill={index === 0 ? HERO : ROW_RAMP[index % ROW_RAMP.length]}
          opacity={index === 0 ? 1 : 0.85}
        />
      ))}
    </svg>
  )
}

/** Minified donut for the sentiment tooltip — three blue ticks. */
function MiniDonut() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="12" fill="none" stroke={SENTIMENT_COLORS[0]} strokeWidth="6" />
      <circle
        cx="17"
        cy="17"
        r="12"
        fill="none"
        stroke={SENTIMENT_COLORS[1]}
        strokeWidth="6"
        strokeDasharray="26 75"
        strokeDashoffset="-30"
        strokeLinecap="round"
      />
      <circle
        cx="17"
        cy="17"
        r="12"
        fill="none"
        stroke={SENTIMENT_COLORS[2]}
        strokeWidth="6"
        strokeDasharray="15 75"
        strokeDashoffset="-56"
        strokeLinecap="round"
      />
    </svg>
  )
}

const tooltipCard = { borderRadius: 12, borderColor: GRID, fontSize: 12 }

/**
 * Three graphs for a keyword UUID, restyled on the lieflat Basics grammar in
 * a brand-blue custom board (single hue, darkest = most important):
 *
 * - F2 Hairline Line: 14-day mentions, one dot = one day.
 * - F5 Tick Rows: signal mix by event kind (mention/question/complaint/praise),
 *   ranked darkest-first — replaces the old single-bar "by platform" card,
 *   which could only ever render one bar for a platform-scoped keyword.
 * - F4 Tick Donut: sentiment share, one tick = one percent, labels carry meaning.
 */
export function DashboardAnalytics({
  keywordId,
  phrase,
  platform,
}: {
  keywordId: string
  phrase: string
  platform: ConnectionPlatform
}) {
  const data = useMemo(() => getKeywordAnalytics(keywordId, phrase, platform), [keywordId, phrase, platform])

  const peak = useMemo(
    () => data.trend.reduce((best, day) => (day.mentions > best.mentions ? day : best), data.trend[0]),
    [data.trend],
  )
  const avg = useMemo(
    () => Math.round(data.totalMentions / Math.max(1, data.trend.length)),
    [data.totalMentions, data.trend.length],
  )

  const typeRows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of data.events) counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
    return (Object.keys(FIREHOSE_TYPE_LABELS) as Array<keyof typeof FIREHOSE_TYPE_LABELS>)
      .map((type) => ({ type, label: FIREHOSE_TYPE_LABELS[type], count: counts.get(type) ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [data.events])
  const topRow = typeRows[0]

  const sentimentRows = useMemo(
    () =>
      data.sentiment.map((slice, index) => ({
        ...slice,
        fill: SENTIMENT_COLORS[index % SENTIMENT_COLORS.length],
      })),
    [data.sentiment],
  )
  const positive = data.sentiment.find((slice) => slice.name === 'Positive')

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title={peak ? `Mentions peaked at ${peak.mentions} on ${peak.date}` : 'Mentions over the last 14 days'}
        metric={`${data.totalMentions} mentions`}
        info={`one dot = one day · avg ${avg}/day · last 14 days`}
        infoVisual={<MiniTrend />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.trend} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id="lk-mentions-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HERO} stopOpacity={0.32} />
                <stop offset="100%" stopColor={HERO} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: TICK }}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: TICK }} width={36} />
            <Tooltip
              contentStyle={tooltipCard}
              labelStyle={{ fontWeight: 700 }}
              formatter={(value) => [`${value} mentions`, 'Mentions']}
              labelFormatter={(label) => `${label} · ${phrase}`}
            />
            <Area
              type="monotone"
              dataKey="mentions"
              name="Mentions"
              stroke={HERO}
              strokeWidth={2.75}
              fill="url(#lk-mentions-fill)"
              dot={{ r: 2.5, fill: HERO, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: DEEP, stroke: '#fff', strokeWidth: 2 }}
              // Static board: the numbers must never replay when the page
              // re-renders (e.g. opening the post inspect sheet).
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={topRow && topRow.count > 0 ? `${topRow.label}s carry the stream` : 'What the firehose is saying'}
        metric={`${data.eventTotal} signals`}
        info="one row = one signal kind · ranked darkest-first"
        infoVisual={<MiniRows />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={typeRows} layout="vertical" margin={{ top: 4, right: 44, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: TICK, fontWeight: 600 }}
              width={78}
            />
            <Tooltip
              contentStyle={tooltipCard}
              labelStyle={{ fontWeight: 700 }}
              formatter={(value) => [`${value} signals`, 'Signals']}
            />
            <Bar
              dataKey="count"
              name="Signals"
              radius={[0, 6, 6, 0]}
              barSize={18}
              // Static board: the numbers must never replay when the page
              // re-renders (e.g. opening the post inspect sheet).
              isAnimationActive={false}
            >
              {typeRows.map((_, index) => (
                <Cell key={index} fill={ROW_RAMP[index % ROW_RAMP.length]} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  fill: '#0B0B0C',
                  fontFamily: "'Satoshi', Inter, system-ui, sans-serif",
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={positive ? `${positive.value}% of mentions read positive` : 'How the mentions feel'}
        metric={`${positive?.value ?? 0}% positive`}
        info="one tick = one percent · labels carry the meaning, not color alone"
        infoVisual={<MiniDonut />}
      >
        <div className="relative h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentRows}
                dataKey="value"
                nameKey="name"
                innerRadius="66%"
                outerRadius="88%"
                paddingAngle={3}
                cornerRadius={4}
                stroke="#fff"
                strokeWidth={2}
                // Static board: the numbers must never replay when the page
                // re-renders (e.g. opening the post inspect sheet).
                isAnimationActive={false}
              >
                {sentimentRows.map((row) => (
                  <Cell key={row.name} fill={row.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipCard}
                formatter={(value, name) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p
              className="text-2xl tabular-nums"
              style={{ fontFamily: "'Satoshi', Inter, system-ui, sans-serif", fontWeight: 900, color: '#0B0B0C' }}
            >
              {positive?.value ?? 0}%
            </p>
            <p className="text-[11px] font-semibold text-text-secondary">positive</p>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {sentimentRows.map((row) => (
            <span key={row.name} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: row.fill }}
              />
              <span className="font-semibold text-text-primary">{row.name}</span>
              <span
                className="tabular-nums"
                style={{ fontFamily: "'Satoshi', Inter, system-ui, sans-serif", fontWeight: 900, color: '#0B0B0C' }}
              >
                {row.value}%
              </span>
            </span>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
