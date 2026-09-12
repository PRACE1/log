import { useSquircleClip } from '@listeningkit/ui'
import { SocialGlyph, type SocialIcon } from '@/lib/social-icons'

export function DashboardFeedHeader({ icon }: { icon: SocialIcon }) {
  const clip = useSquircleClip<HTMLDivElement>(16)

  return (
    <div ref={clip.ref} style={clip.style} className="sticky top-0 z-10 flex shrink-0 items-center gap-2.5 bg-[#2A8CFF] px-4 py-3">
      <SocialGlyph icon={icon} className="size-5 text-white" />
      <p className="text-sm font-bold text-white">{icon.label}</p>
    </div>
  )
}
