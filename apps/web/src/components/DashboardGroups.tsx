import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Clock, Plus } from 'lucide-react'
import { Button, useSquircleClip } from '@listeningkit/ui'
import { SOCIAL_ICONS, SocialGlyph, type SocialIcon } from '@/lib/social-icons'
import {
  acceptCommunity,
  getCommunities,
  joinCommunity,
  leaveCommunity,
  type Community
} from '@/lib/communities'
import { type ConnectionPlatform } from '@/lib/connections'
import { DashboardGroupsForm } from './DashboardGroupsForm'
import { useDashboardFormSlot } from './DashboardFormSlot'

function GroupsTab({ icon, active, onClick }: { icon: SocialIcon; active: boolean; onClick: () => void }) {
  const clip = useSquircleClip<HTMLSpanElement>(9)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold ${
        active ? 'bg-brand-600/10 text-brand-600' : 'text-text-secondary'
      }`}
    >
      <span ref={clip.ref} style={clip.style} className={`flex size-7 items-center justify-center ${active ? 'bg-[#2A8CFF]' : 'bg-black/5'}`}>
        <SocialGlyph icon={icon} className={`size-4 ${active ? 'text-white' : 'text-text-secondary'}`} />
      </span>
      {icon.label}
    </button>
  )
}

function initials(name: string): string {
  const words = name.replace(/^r\//, '').split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
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
  const [busyId, setBusyId] = useState<string | null>(null)
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

  // The form lives in the layout's third column, not in the page: register
  // it when open, clear it when closed or when the page unmounts.
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
        <Button type="button" variant="blue" size="lg" shadow="hard" onClick={() => { setFormScope(null); setFormOpen(true) }}>
          <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
          Add group
        </Button>
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
      ) : (
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
      )}
    </div>
  )
}