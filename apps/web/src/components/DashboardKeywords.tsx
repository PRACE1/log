import { useCallback, useEffect, useState } from 'react'
import { LayoutGrid, Pause, Play, Plus, Table2, Trash } from 'lucide-react'
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
import { platformLabel } from '../lib/connections'
import { SOCIAL_ICONS, SocialBadge, type SocialIcon } from '../lib/social-icons'
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

function keywordActions(
  keyword: Keyword,
  onToggleStatus: (keyword: Keyword) => void,
  onRemove: (keyword: Keyword) => void
) {
  return [
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

function KeywordCard({
  keyword,
  group,
  onToggleStatus,
  onRemove
}: {
  keyword: Keyword
  group: Community | null
  onToggleStatus: (keyword: Keyword) => void
  onRemove: (keyword: Keyword) => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  const icon = SOCIAL_ICONS.find((i) => i.id === keyword.platform) as SocialIcon | undefined

  return (
    <div ref={clip.ref} style={clip.style} className="flex items-center gap-4 bg-white p-5">
      {icon ? (
        <SocialBadge icon={icon} variant="blue" />
      ) : (
        <span className="size-8 rounded-full bg-black/5" aria-hidden="true" />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-bold text-text-primary">{keyword.phrase}</span>
        <span className="truncate text-sm text-text-secondary">
          {platformLabel(keyword.platform)}
          {group ? ` · ${group.name}` : ''} · {keyword.signalsCount} signals
        </span>
      </span>
      <StatusBadge status={keyword.status} />
      <Dropdown
        aria-label={`${keyword.phrase} keyword actions`}
        items={keywordActions(keyword, onToggleStatus, onRemove)}
      />
    </div>
  )
}

export function DashboardKeywords() {
  const { success, error: notifyError } = useToast()
  const [keywords, setKeywords] = useState<Keyword[] | null>(null)
  const [communityMap, setCommunityMap] = useState<Map<string, Community>>(new Map())
  const [view, setView] = useState<ViewMode>('cards')
  const [formOpen, setFormOpen] = useState(false)

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
  }, [])

  // The form lives in the layout's third column, not in the page: register
  // it when open, clear it when closed or when the page unmounts.
  const setFormSlot = useDashboardFormSlot()
  useEffect(() => {
    if (!formOpen) {
      setFormSlot(null)
      return
    }
    setFormSlot(<DashboardKeywordsForm open onClose={() => setFormOpen(false)} onCreated={load} />)
    return () => setFormSlot(null)
  }, [formOpen, load, setFormSlot])

  function groupFor(keyword: Keyword): Community | null {
    return keyword.groupId ? (communityMap.get(keyword.groupId) ?? null) : null
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
          <Button type="button" variant="blue" size="lg" shadow="hard" onClick={() => setFormOpen(true)}>
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
              onToggleStatus={handleToggleStatus}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {rows.length > 0 && view === 'table' && (
        <Table>
          <table className="w-full min-w-[820px] text-left">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Keyword</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Group</TableHead>
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
                  <TableRow key={keyword.id}>
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
                    <TableCell>{platformLabel(keyword.platform)}</TableCell>
                    <TableCell className="max-w-48 truncate text-text-secondary" title={group?.name}>
                      {group ? group.name : '—'}
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
                        items={keywordActions(keyword, handleToggleStatus, handleRemove)}
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