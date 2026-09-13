import { siFacebook, siReddit, siX } from 'simple-icons'
import { useComposedRef, useSquircleBorder, useSquircleClip } from '@listeningkit/ui'

export type SocialIcon = {
  id: string
  label: string
  path: string
  hex: string
}

// Same three platforms as ui-kit's social-listening section, but rendered
// from the `simple-icons` library instead of raw SVGs in public/.
export const SOCIAL_ICONS: SocialIcon[] = [
  { id: 'facebook', label: siFacebook.title, path: siFacebook.path, hex: siFacebook.hex },
  { id: 'x', label: siX.title, path: siX.path, hex: siX.hex },
  { id: 'reddit', label: siReddit.title, path: siReddit.path, hex: siReddit.hex }
]

export function SocialGlyph({ icon, className }: { icon: SocialIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={icon.label} className={className} fill="currentColor">
      <path d={icon.path} />
    </svg>
  )
}

export type SocialBadgeVariant = 'white' | 'blue'

export function SocialBadge({
  icon,
  variant = 'white',
  className
}: {
  icon: SocialIcon
  variant?: SocialBadgeVariant
  className?: string
}) {
  const RADIUS = 12
  const isBlue = variant === 'blue'
  const clip = useSquircleClip<HTMLSpanElement>(RADIUS)
  const border = useSquircleBorder<HTMLSpanElement>(RADIUS + 1)
  const setRef = useComposedRef(clip.ref, border.ref)

  return (
    <span
      title={icon.label}
      ref={setRef}
      style={clip.style}
      // Fixed-size icon: never flex-shrink, or the box distorts (e.g. 28×32
      // inside a 28px parent) and the squircle measures the wrong geometry.
      className={`relative flex size-8 shrink-0 items-center justify-center ${className ?? ''}`}
    >
      <svg
        width={border.state.width}
        height={border.state.height}
        viewBox={border.state.path ? `0 0 ${border.state.width} ${border.state.height}` : undefined}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible"
      >
        {border.state.path ? (
          <path
            d={border.state.path}
            fill={isBlue ? '#2A8CFF' : '#FFFFFF'}
            stroke={isBlue ? '#FFFFFF' : '#2A8CFF'}
            strokeWidth={2}
          />
        ) : null}
      </svg>
      <SocialGlyph
        icon={icon}
        className={`relative z-10 size-4 ${isBlue ? 'text-white' : 'text-[#2A8CFF]'}`}
      />
    </span>
  )
}
