import { useState, type ReactNode } from 'react'
import { Button, useSquircleClip } from '@listeningkit/ui'
import { SOCIAL_ICONS, SocialGlyph, type SocialIcon } from '@/lib/social-icons'
import { COMMUNITIES, loadJoined, saveJoined, type Community } from '@/lib/communities'

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
  joined,
  onJoin,
  onLeave,
}: {
  community: Community
  joined: boolean
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
      {joined ? (
        <Button type="button" variant="ghost" size="lg" onClick={onLeave} className="w-full">
          Leave
        </Button>
      ) : (
        <Button type="button" variant="blue" size="lg" onClick={onJoin} className="w-full font-bold text-white">
          Join
        </Button>
      )}
    </div>
  )
}

function CommunitySection({
  title,
  sub,
  children,
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
  const [platform, setPlatform] = useState(SOCIAL_ICONS[0].id)
  const [joined, setJoined] = useState<string[]>(() => loadJoined())
  const active = SOCIAL_ICONS.find((i) => i.id === platform) ?? SOCIAL_ICONS[0]

  function join(id: string) {
    setJoined((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id]
      saveJoined(next)
      return next
    })
  }

  function leave(id: string) {
    setJoined((prev) => {
      const next = prev.filter((v) => v !== id)
      saveJoined(next)
      return next
    })
  }

  const current = COMMUNITIES.filter((c) => c.platform === platform && joined.includes(c.id))
  const recommended = COMMUNITIES.filter((c) => c.platform === platform && !joined.includes(c.id))

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Groups</h1>
        <p className="text-sm text-text-secondary">Pick the communities ListeningKit watches for you.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {SOCIAL_ICONS.map((icon) => (
          <GroupsTab key={icon.id} icon={icon} active={icon.id === platform} onClick={() => setPlatform(icon.id)} />
        ))}
      </div>
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
            <CommunityCard key={c.id} community={c} joined onJoin={() => join(c.id)} onLeave={() => leave(c.id)} />
          ))
        )}
      </CommunitySection>
      <CommunitySection
        title="Recommended communities"
        sub={`Popular ${active.label} spots your customers hang out.`}
      >
        {recommended.length === 0 ? (
          <p className="py-4 text-sm text-text-secondary">You&apos;re in all of them. Nice.</p>
        ) : (
          recommended.map((c) => (
            <CommunityCard key={c.id} community={c} joined={false} onJoin={() => join(c.id)} onLeave={() => leave(c.id)} />
          ))
        )}
      </CommunitySection>
    </div>
  )
}
