import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Check, Clock, LayoutGrid, LogOut, Plus, Table2, X } from 'lucide-react'
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
  useSquircleClip
} from '@listeningkit/ui'
import { SOCIAL_ICONS, SocialGlyph, type SocialIcon } from '@/lib/social-icons'
import {
  acceptCommunity,
  getCommunities,
  joinCommunity,
  leaveCommunity,
  type Community
} from '@/lib/communities'
import { getAccounts, type ConnectionPlatform, type ConnectionRecord } from '@/lib/connections'
import { healthForAccountId } from '@/lib/health'
import { AccountHealthBadge } from './AccountHealthBadge'
import { DashboardGroupsForm } from './DashboardGroupsForm'
import { useDashboardFormSlot } from './DashboardFormSlot'
import { DashboardTab } from './DashboardTab'

function GroupsTab({ icon, active, onClick }: { icon: SocialIcon; active: boolean; onClick: () => void }) {
  return (
    <DashboardTab
      label={icon.label}
      icon={<SocialGlyph icon={icon} className="size-4" />}
      active={active}
      onClick={onClick}
    />
  )
}

function initials(name: string): string {
  const words = name.replace(/^r\//, '').split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

type ViewMode = 'cards' | 'table'

function JoinStateBadge({ community }: { community: Community }) {
  switch (community.joinState) {
    case 'accepted':
      return (
        <Badge variant="success" dot>
          Member
        </Badge>
      )
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    default:
      return <Badge variant="muted">Not joined</Badge>
  }
}

function communityActions(
  community: Community,
  handlers: {
    onJoin: (community: Community) => void
    onLeave: (community: Community) => void
    onAccept: (community: Community) => void
    onCancel: (community: Community) => void
  }
) {
  if (community.joinState === 'accepted') {
    return [
      {
        id: 'leave',
        label: 'Leave',
        icon: <LogOut aria-hidden="true" className="size-4" />,
        danger: true,
        onSelect: () => handlers.onLeave(community)
      }
    ]
  }
  if (community.joinState === 'pending') {
    return [
      {
        id: 'accept',
        label: 'Simulate acceptance',
        icon: <Check aria-hidden="true" className="size-4" />,
        onSelect: () => handlers.onAccept(community)
      },
      {
        id: 'cancel',
        label: 'Cancel request',
        icon: <X aria-hidden="true" className="size-4" />,
        danger: true,
        onSelect: () => handlers.onCancel(community)
      }
    ]
  }
  return [
    {
      id: 'join',
      label: 'Join',
      icon: <Plus aria-hidden="true" className="size-4" />,
      onSelect: () => handlers.onJoin(community)
    }
  ]
}

function CommunityCard({
  community,
  busy,
  onJoin,
  onLeave
}: {
  community: Community
  busy: boolean
  onJoin: () => void
  onLeave: () => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)

  return (
    <div ref={clip.ref} style={clip.style} className="flex flex-col gap-4 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2A8CFF]/10 text-sm font-bold text-[#2A8CFF]">
          {initials(community.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold text-text-primary" title={community.name}>{community.name}</span>
          <span className="truncate text-sm text-text-secondary" title={`${community.handle} · ${community.members}`}>
            {community.handle} · {community.members}
          </span>
        </span>
      </div>
      <p className="line-clamp-2 min-h-10 text-sm text-text-secondary" title={community.description}>{community.description}</p>
      {community.joinState === 'accepted' && community.accountLabel ? (
        <p className="-mt-2 text-xs text-text-secondary">Joined as {community.accountLabel}</p>
      ) : null}
      {community.joinState === 'accepted' ? (
        <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={onLeave} className="w-full">
          {busy ? 'Leaving…' : 'Leave'}
        </Button>
      ) : (
        <Button type="button" variant="blue" size="lg" disabled={busy} onClick={onJoin} className="w-full font-bold text-white">
          {busy ? 'Joining…' : 'Join'}
        </Button>
      )}
    </div>
  )
}

function PendingCommunityCard({
  community,
  busy,
  onAccept,
  onCancel
}: {
  community: Community
  busy: boolean
  onAccept: () => void
  onCancel: () => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)

  return (
    <div ref={clip.ref} style={clip.style} className="flex flex-col gap-4 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-600">
          <Clock size={18} strokeWidth={2.25} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold text-text-primary" title={community.name}>{community.name}</span>
          <span className="truncate text-sm text-text-secondary" title={`${community.handle} · ${community.members}`}>
            {community.handle} · {community.members}
          </span>
        </span>
      </div>
      <p className="-mt-2 text-xs text-text-secondary">
        Request sent — waiting on the group to accept
        {community.accountLabel ? ` · requested with ${community.accountLabel}` : ''}
        {community.answers.length > 0
          ? ` · ${community.answers.length} answer${community.answers.length === 1 ? '' : 's'} sent`
          : ''}
        .
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="blue" size="lg" disabled={busy} onClick={onAccept} className="w-full">
          {busy ? 'Accepting…' : 'Simulate acceptance'}
        </Button>
        <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={onCancel} className="w-full">
          Cancel request
        </Button>
      </div>
    </div>
  )
}

function CommunitySection({
  title,
  sub,
  children
}: {
  title: string
  sub: string
  children: ReactNode
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <p className="text-sm text-text-secondary">{sub}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
    </div>
  )
}

export function DashboardGroups() {
  const [platform, setPlatform] = useState<ConnectionPlatform>(SOCIAL_ICONS[0].id as ConnectionPlatform)
  const [communities, setCommunities] = useState<Community[] | null>(null)
  const [accounts, setAccounts] = useState<ConnectionRecord[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>('cards')
  const [formOpen, setFormOpen] = useState(false)
  const [formScope, setFormScope] = useState<{ platform: ConnectionPlatform; communityId: string } | null>(null)

  const load = useCallback(() => {
    getCommunities({ platform })
      .then(setCommunities)
      .catch(() => setCommunities([]))
  }, [platform])

  useEffect(() => {
    setCommunities(null)
    load()
  }, [load])

  // The joining account behind each community — the account badges read
  // their health from this roster, not from the community row itself.
  useEffect(() => {
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
      <DashboardGroupsForm
        open
        onClose={() => setFormOpen(false)}
        onJoined={load}
        initialPlatform={formScope?.platform ?? null}
        initialCommunityId={formScope?.communityId ?? null}
      />
    )
    return () => setFormSlot(null)
  }, [formOpen, formScope, load, setFormSlot])

  const active = SOCIAL_ICONS.find((i) => i.id === platform) ?? SOCIAL_ICONS[0]
  const current = (communities ?? []).filter((c) => c.joinState === 'accepted')
  const pending = (communities ?? []).filter((c) => c.joinState === 'pending')
  const recommended = (communities ?? []).filter((c) => c.joinState === 'none')
  // Flat table order mirrors the card sections: members, then pending,
  // then not joined.
  const all = [...current, ...pending, ...recommended]

  async function handleLeave(community: Community) {
    setBusyId(community.id)
    try {
      setCommunities(await leaveCommunity(community.id))
    } finally {
      setBusyId(null)
    }
  }

  // The group side accepting a request — the mock stands in for the admin
  // until the live client reports real acceptances.
  async function handleAccept(community: Community) {
    setBusyId(community.id)
    try {
      await acceptCommunity(community.id)
      load()
    } finally {
      setBusyId(null)
    }
  }

  // Cancelling a pending request is the same relation write as leaving.
  async function handleCancelRequest(community: Community) {
    await handleLeave(community)
  }

  // Facebook joins need the connected account that joins, so they open the
  // form pre-scoped to this community; x / reddit go straight to the API.
  async function handleJoin(community: Community) {
    if (community.platform === 'facebook') {
      setFormScope({ platform: community.platform, communityId: community.id })
      setFormOpen(true)
      return
    }
    setBusyId(community.id)
    try {
      await joinCommunity(community.id)
      load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Groups</h1>
          <p className="text-sm text-text-secondary">Pick the communities ListeningKit watches for you.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Card / table view switcher — same segmented shape as the keywords page. */}
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
          <Button type="button" variant="blue" size="lg" shadow="hard" onClick={() => { setFormScope(null); setFormOpen(true) }}>
            <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
            Add group
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SOCIAL_ICONS.map((icon) => (
          <GroupsTab key={icon.id} icon={icon} active={icon.id === platform} onClick={() => setPlatform(icon.id as ConnectionPlatform)} />
        ))}
      </div>
      {communities === null ? (
        <p className="rounded-xl bg-black/5 p-4 text-sm text-text-secondary" aria-busy="true">
          Loading {active.label} communities…
        </p>
      ) : view === 'cards' ? (
        <>
          <CommunitySection
            title="Your current communities"
            sub={`Listening on ${active.label} right now.`}
          >
            {current.length === 0 ? (
              <p className="py-4 text-sm text-text-secondary">
                You haven&apos;t joined any {active.label} communities yet — pick one below.
              </p>
            ) : (
              current.map((c) => (
                <CommunityCard key={c.id} community={c} busy={busyId === c.id} onJoin={() => handleJoin(c)} onLeave={() => handleLeave(c)} />
              ))
            )}
          </CommunitySection>
          {pending.length > 0 ? (
            <CommunitySection
              title="Pending acceptance"
              sub="Join requests waiting on the group — they move up once accepted."
            >
              {pending.map((c) => (
                <PendingCommunityCard
                  key={c.id}
                  community={c}
                  busy={busyId === c.id}
                  onAccept={() => handleAccept(c)}
                  onCancel={() => handleCancelRequest(c)}
                />
              ))}
            </CommunitySection>
          ) : null}
          <CommunitySection
            title="Recommended communities"
            sub={`Popular ${active.label} spots your customers hang out.`}
          >
            {recommended.length === 0 ? (
              <p className="py-4 text-sm text-text-secondary">
                {pending.length > 0
                  ? 'Nothing new to join — the rest are waiting on acceptance above.'
                  : "You're in all of them. Nice."}
              </p>
            ) : (
              recommended.map((c) => (
                <CommunityCard key={c.id} community={c} busy={busyId === c.id} onJoin={() => handleJoin(c)} onLeave={() => handleLeave(c)} />
              ))
            )}
          </CommunitySection>
        </>
      ) : all.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
          No {active.label} communities tracked yet.
        </p>
      ) : (
        <Table>
          <table className="w-full min-w-[780px] text-left">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Community</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {all.map((c) => {
                const health = healthForAccountId(accounts, c.accountId)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2A8CFF]/10 text-xs font-bold text-[#2A8CFF]">
                          {initials(c.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold" title={c.name}>
                            {c.name}
                          </span>
                          <span
                            className="block truncate text-xs text-text-secondary"
                            title={`${c.handle} · ${c.members}`}
                          >
                            {c.handle} · {c.members}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <JoinStateBadge community={c} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {health ? (
                        <AccountHealthBadge label={c.accountLabel ?? c.accountId ?? ''} health={health} />
                      ) : (
                        <span className="text-text-secondary">{c.accountLabel ?? '—'}</span>
                      )}
                    </TableCell>
                  <TableCell className="whitespace-nowrap text-text-secondary">{c.members}</TableCell>
                    <TableCell className="text-right">
                      <Dropdown
                        aria-label={`${c.name} community actions`}
                        items={communityActions(c, {
                          onJoin: handleJoin,
                          onLeave: handleLeave,
                          onAccept: handleAccept,
                          onCancel: handleCancelRequest
                        })}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </table>
        </Table>
      )}
    </div>
  )
}