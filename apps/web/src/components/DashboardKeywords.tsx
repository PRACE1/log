import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
  useHover,
  useInteractions
} from '@floating-ui/react'
import { LayoutGrid, Pause, Pencil, Play, Plus, Table2, Trash } from 'lucide-react'
import {
  Badge,
  Button,
  Dropdown,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useSquircleClip,
  useToast
} from '@listeningkit/ui'
import {
  deleteKeyword,
  getKeywords,
  saveKeyword,
  type Keyword,
  type KeywordStatus
} from '../lib/keywords'
import { getCommunities, type Community } from '../lib/communities'
import { getAccounts, platformLabel, type ConnectionRecord } from '../lib/connections'
import { healthForAccountId } from '../lib/health'
import { getKeywordAnalytics } from '../lib/analytics'
import { SOCIAL_ICONS, SocialBadge, SocialGlyph, type SocialIcon } from '../lib/social-icons'
import { AccountHealthBadge } from './AccountHealthBadge'
import { DashboardKeywordsForm } from './DashboardKeywordsForm'
import { useDashboardFormSlot } from './DashboardFormSlot'

type ViewMode = 'cards' | 'table'

function formatAddedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: KeywordStatus }) {
  return status === 'listening' ? (
    <Badge variant="success" dot>
      Listening
    </Badge>
  ) : (
    <Badge variant="muted">Paused</Badge>
  )
}

/** Live mini sparkline — same brand-blue language as the analytics minis. */
function MiniSpark({ values }: { values: number[] }) {
  const W = 64
  const H = 28
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)
  const line = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * W
      const y = H - ((value - min) / span) * (H - 3)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="block h-full w-full"
      aria-hidden="true"
    >
      <polygon points={`0,${H} ${line} ${W},${H}`} fill="#2A8CFF" opacity="0.3" />
      <polyline
        points={line}
        fill="none"
        stroke="#2A8CFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Account badge with a health tooltip: a live mini graph of what this
 * keyword is pulling in, plus the serving account's health from lib/health.
 * An unhealthy (or missing) joining account flags the badge red so the
 * issue reads without hovering; a stale one flags amber. Scopes without an
 * account (subreddits) carry no health — the badge stays neutral.
 *
 * The tooltip portals to document.body (same pattern as the kit's
 * Dropdown/Select) because each table row carries a squircle `clip-path` —
 * an in-cell absolutely-positioned popup would be clipped to the row and
 * trapped in its stacking context.
 */
function AccountHealthCell({
  keyword,
  group,
  accounts
}: {
  keyword: Keyword
  group: Community | null
  accounts: ConnectionRecord[]
}) {
  const trend = useMemo(
    () => getKeywordAnalytics(keyword.id, keyword.phrase, keyword.platform).trend.map((day) => day.mentions),
    [keyword.id, keyword.phrase, keyword.platform]
  )
  const label = group?.accountLabel
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open: tooltipOpen,
    onOpenChange: setTooltipOpen,
    placement: 'right',
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })]
  })
  const hover = useHover(context, { delay: { open: 120, close: 100 }, move: false })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover])
  const health = healthForAccountId(accounts, group?.accountId ?? null)
  const flagged = health !== null && health.state !== 'healthy'
  const platformIcon = group ? SOCIAL_ICONS.find((i) => i.id === group.platform) : undefined
  // X's brand hex is #000000 — invisible on the dark tooltip, so fall back to white.
  const platformIconColor = platformIcon
    ? platformIcon.hex.toUpperCase() === '#000000'
      ? '#FFFFFF'
      : platformIcon.hex
    : undefined
  if (!label) return <span className="text-text-secondary">—</span>
  return (
    <span ref={refs.setReference} {...getReferenceProps()} className="inline-flex">
      {health ? (
        <AccountHealthBadge label={label} health={health} />
      ) : (
        <Badge variant="neutral">{label}</Badge>
      )}
      {tooltipOpen && (
        <FloatingPortal>
          <span
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            role="tooltip"
            className="z-50 flex w-max max-w-sm gap-2.5 whitespace-normal bg-text-primary p-4 text-xs leading-snug text-white shadow-lg [border-radius:14px]"
          >
            <span className="flex w-40 shrink-0 self-stretch items-center justify-center overflow-hidden bg-white/10 [border-radius:10px]">
              <MiniSpark values={trend} />
            </span>
            <span className="flex shrink-0 flex-col">
              <span className="flex items-center gap-1.5 whitespace-nowrap font-bold">
                {platformIcon ? (
                  <span className="inline-flex shrink-0" style={{ color: platformIconColor }} aria-hidden="true">
                    <SocialGlyph icon={platformIcon} className="size-3" />
                  </span>
                ) : null}
                {label}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
                {group?.url ? (
                  <a
                    href={group.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2A8CFF] underline decoration-dashed decoration-[#2A8CFF]/50 underline-offset-2 hover:decoration-[#2A8CFF]"
                  >
                    {group.name}
                  </a>
                ) : (
                  <span>{group?.name}</span>
                )}
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{keyword.signalsCount} signals</span>
              </span>
              {health ? (
                <span
                  className={`mt-0.5 flex items-center gap-1.5 whitespace-nowrap font-semibold ${flagged ? 'text-red-300' : 'text-emerald-300'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block size-1.5 shrink-0 rounded-full ${flagged ? 'bg-red-300' : 'bg-emerald-300'}`}
                  />
                  {health.state === 'unhealthy'
                    ? 'Not connected — flagged'
                    : health.state === 'degraded'
                      ? 'Stale — verify the connection'
                      : 'Connected — signals flowing'}
                </span>
              ) : null}
            </span>
          </span>
        </FloatingPortal>
      )}
    </span>
  )
}

function keywordActions(
  keyword: Keyword,
  onEdit: (keyword: Keyword) => void,
  onToggleStatus: (keyword: Keyword) => void,
  onRemove: (keyword: Keyword) => void
) {
  return [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Pencil aria-hidden="true" className="size-4" />,
      onSelect: () => onEdit(keyword)
    },
    {
      id: keyword.status === 'listening' ? 'pause' : 'resume',
      label: keyword.status === 'listening' ? 'Pause' : 'Resume',
      icon: keyword.status === 'listening' ? (
        <Pause aria-hidden="true" className="size-4" />
      ) : (
        <Play aria-hidden="true" className="size-4" />
      ),
      onSelect: () => onToggleStatus(keyword)
    },
    {
      id: 'remove',
      label: 'Remove',
      icon: <Trash aria-hidden="true" className="size-4" />,
      danger: true,
      onSelect: () => onRemove(keyword)
    }
  ]
}

export function KeywordCard({
  keyword,
  group,
  onOpen,
  onEdit,
  onToggleStatus,
  onRemove
}: {
  keyword: Keyword
  group: Community | null
  onOpen: (keyword: Keyword) => void
  onEdit: (keyword: Keyword) => void
  onToggleStatus: (keyword: Keyword) => void
  onRemove: (keyword: Keyword) => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  const icon = SOCIAL_ICONS.find((i) => i.id === keyword.platform) as SocialIcon | undefined

  return (
    <div
      ref={clip.ref}
      style={clip.style}
      onClick={() => onOpen(keyword)}
      title={`Open analytics for “${keyword.phrase}”`}
      className="flex cursor-pointer items-center gap-4 bg-[#2A8CFF] p-5"
    >
      {icon ? (
        <SocialGlyph icon={icon} className="size-12 shrink-0 text-white" />
      ) : (
        <span className="size-12 rounded-full bg-white/20" aria-hidden="true" />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xl font-bold text-white">“{keyword.phrase}”</span>
        <span className="truncate text-sm text-white/75">{platformLabel(keyword.platform)}</span>
        {group ? (
          <span className="truncate text-sm text-white/75">{group.name}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-sm font-bold tabular-nums text-white">
          {keyword.signalsCount} signals
        </span>
        <span className="flex items-center gap-2">
          <StatusBadge status={keyword.status} />
          <Dropdown
            aria-label={`${keyword.phrase} keyword actions`}
            items={keywordActions(keyword, onEdit, onToggleStatus, onRemove)}
            className="text-white hover:text-white"
          />
        </span>
      </span>
    </div>
  )
}

export function DashboardKeywords() {
  const { success, error: notifyError } = useToast()
  const navigate = useNavigate()
  const [keywords, setKeywords] = useState<Keyword[] | null>(null)
  const [communityMap, setCommunityMap] = useState<Map<string, Community>>(new Map())
  const [accounts, setAccounts] = useState<ConnectionRecord[]>([])
  const [view, setView] = useState<ViewMode>('cards')
  const [formOpen, setFormOpen] = useState(false)
  // Edit scope: set alongside formOpen to jump the form straight to the
  // phrase step for this keyword; null means create mode.
  const [editScope, setEditScope] = useState<Keyword | null>(null)

  const load = useCallback(() => {
    getKeywords().then(setKeywords).catch(() => setKeywords([]))
  }, [])

  useEffect(() => {
    load()
    // One unreferenced fetch of the full roster lets card sublines and
    // table rows resolve keyword.groupId to a community name.
    getCommunities()
      .then((list) => setCommunityMap(new Map(list.map((community) => [community.id, community]))))
      .catch(() => setCommunityMap(new Map()))
    // Account health for the table's account badges — lib/health assesses
    // the roster, each badge variant reads from that.
    getAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]))
  }, [])

  // The form lives in the layout overlay, not in the page: register it
  // when open, clear it when closed or when the page unmounts.
  const setFormSlot = useDashboardFormSlot()
  useEffect(() => {
    if (!formOpen) {
      setFormSlot(null)
      return
    }
    setFormSlot(
      <DashboardKeywordsForm
        open
        onClose={() => setFormOpen(false)}
        onCreated={load}
        initialKeyword={editScope}
      />
    )
    return () => setFormSlot(null)
  }, [formOpen, editScope, load, setFormSlot])

  function groupFor(keyword: Keyword): Community | null {
    return keyword.groupId ? (communityMap.get(keyword.groupId) ?? null) : null
  }

  // Jump the form straight to the phrase step for this keyword.
  function handleEdit(keyword: Keyword) {
    setEditScope(keyword)
    setFormOpen(true)
  }

  // Open the analytics view for a keyword UUID (card + table row).
  // The row dropdown stops propagation, so its actions never navigate.
  function handleOpen(keyword: Keyword) {
    navigate(`/dashboard/analytics/${keyword.id}`)
  }

  async function handleToggleStatus(keyword: Keyword) {
    const status: KeywordStatus = keyword.status === 'listening' ? 'paused' : 'listening'
    try {
      setKeywords(await saveKeyword({ ...keyword, status }))
      success(status === 'listening' ? `“${keyword.phrase}” resumed` : `“${keyword.phrase}” paused`)
    } catch (err: unknown) {
      notifyError('Update failed', err instanceof Error ? err.message : 'Could not update the keyword.')
    }
  }

  async function handleRemove(keyword: Keyword) {
    try {
      setKeywords(await deleteKeyword(keyword.id))
      success(`“${keyword.phrase}” removed`)
    } catch (err: unknown) {
      notifyError('Remove failed', err instanceof Error ? err.message : 'Could not remove the keyword.')
    }
  }

  const rows = keywords ?? []

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Keywords</h1>
          <p className="text-sm text-text-secondary">
            {keywords === null
              ? 'Loading keywords…'
              : `The phrases we're listening for — ${rows.filter((k) => k.status === 'listening').length} live, per platform.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Card / table view switcher — same segmented shape as the dashboard chrome. */}
          <div className="flex h-9 items-center gap-0.5 rounded-lg border border-black/10 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView('cards')}
              aria-pressed={view === 'cards'}
              className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors ${
                view === 'cards' ? 'bg-[#2A8CFF] text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              aria-pressed={view === 'table'}
              className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors ${
                view === 'table' ? 'bg-[#2A8CFF] text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Table2 className="size-3.5" aria-hidden="true" />
              Table
            </button>
          </div>
          <Button type="button" variant="blue" size="lg" shadow="hard" onClick={() => { setEditScope(null); setFormOpen(true) }}>
            <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
            Add keyword
          </Button>
        </div>
      </div>

      {rows.length > 0 && view === 'cards' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((keyword) => (
            <KeywordCard
              key={keyword.id}
              keyword={keyword}
              group={groupFor(keyword)}
              onOpen={handleOpen}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {rows.length > 0 && view === 'table' && (
        <Table>
          <table className="w-full min-w-[840px] text-left">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Keyword</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Signals</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((keyword) => {
                const icon = SOCIAL_ICONS.find((i) => i.id === keyword.platform)
                const group = groupFor(keyword)
                return (
                  <TableRow
                    key={keyword.id}
                    onClick={() => handleOpen(keyword)}
                    title={`Open analytics for “${keyword.phrase}”`}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {icon ? (
                          <SocialBadge icon={icon} variant="blue" />
                        ) : (
                          <span className="size-8 rounded-full bg-black/5" aria-hidden="true" />
                        )}
                        <span className="font-semibold">{keyword.phrase}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 text-text-secondary">
                      {/* Links stop propagation so the row's onClick (open
                          analytics) never fires on click-through. */}
                      {group ? (
                        group.url ? (
                          <a
                            href={group.url}
                            target="_blank"
                            rel="noreferrer"
                            title={`Open ${group.name} in a new tab`}
                            onClick={(event) => event.stopPropagation()}
                            className="block max-w-48 truncate font-semibold text-[#2A8CFF] underline decoration-dashed decoration-[#2A8CFF]/50 underline-offset-2 hover:decoration-[#2A8CFF]"
                          >
                            {group.name}
                          </a>
                        ) : (
                          <span className="block max-w-48 truncate font-semibold">{group.name}</span>
                        )
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <AccountHealthCell keyword={keyword} group={group} accounts={accounts} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={keyword.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{keyword.signalsCount}</TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      {formatAddedAt(keyword.addedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown
                        aria-label={`${keyword.phrase} keyword actions`}
                        items={keywordActions(keyword, handleEdit, handleToggleStatus, handleRemove)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </table>
        </Table>
      )}

      {keywords !== null && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          No keywords yet — add one to start listening.
        </p>
      )}
    </div>
  )
}