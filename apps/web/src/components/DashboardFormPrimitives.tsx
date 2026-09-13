import {
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode
} from 'react'
import { Check } from 'lucide-react'
import {
  cn,
  useComposedRef,
  useSquircleBorder,
  useSquircleClip,
  type SquircleBorderState
} from '@listeningkit/ui'
import type { ConnectionPlatform } from '../lib/connections'
import { SOCIAL_ICONS, SocialGlyph, type SocialIcon } from '../lib/social-icons'

/**
 * Shared primitives for the dashboard form sheets (listings / keywords /
 * groups): one platform tile grid, one select-row shape, one loading line.
 * Every form renders the same pieces so the flows feel consistent.
 *
 * All squircle surfaces follow the codebase rule: the shape comes from
 * `useSquircleClip` (clipPath) and the stroke from `useSquircleBorder`
 * (figma squircle path), exactly like `SocialBadge` and the messages
 * composer. No element carries `rounded-*` or `border-*` classes when the
 * squircle primitives own its shape and border.
 */

const NEUTRAL_STROKE = '#E4E7EC'
const ACTIVE_STROKE = '#2A8CFF'

/** Shared squircle stroke colors so form surfaces stay consistent. */
export const SQUIRCLE_NEUTRAL_STROKE = NEUTRAL_STROKE
export const SQUIRCLE_ACTIVE_STROKE = ACTIVE_STROKE

/** Stroke overlay for a squircle surface: the border path, never a CSS border. */
export function SquircleStroke({
  border,
  stroke,
  strokeWidth = 1.5
}: {
  border: SquircleBorderState
  stroke: string
  strokeWidth?: number
}) {
  if (!border.path) return null
  return (
    <svg
      className="pointer-events-none absolute inset-0 block size-full overflow-visible"
      width={border.width}
      height={border.height}
      viewBox={`0 0 ${border.width} ${border.height}`}
      aria-hidden="true"
    >
      <path
        d={border.path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ transition: 'stroke 150ms ease, stroke-width 150ms ease' }}
      />
    </svg>
  )
}

export function PlatformPick({
  value,
  onChange
}: {
  value: ConnectionPlatform | null
  onChange: (platform: ConnectionPlatform) => void
}) {
  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Platform">
      {SOCIAL_ICONS.map((icon) => (
        <PlatformTile
          key={icon.id}
          icon={icon}
          active={value === icon.id}
          onClick={() => onChange(icon.id as ConnectionPlatform)}
        />
      ))}
    </div>
  )
}

/**
 * One platform tile, styled like the onboarding platform cards: a
 * full-width tappable card with a bare logo, the platform name, and a
 * tap-to-select hint — vertically stacked so the choice reads clearly in
 * the narrow sheet. Selecting only marks the card; the sheet's Continue
 * button advances. The picked card flips blue (card and glyph) so the
 * choice reads as made. Shape and stroke come from the squircle primitives.
 */
function PlatformTile({
  icon,
  active,
  onClick
}: {
  icon: SocialIcon
  active: boolean
  onClick: () => void
}) {
  const clip = useSquircleClip<HTMLButtonElement>(16)
  const border = useSquircleBorder<HTMLButtonElement>(17)
  const setRef = useComposedRef(clip.ref, border.ref)
  return (
    <button
      ref={setRef}
      style={clip.style}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-4 p-4 text-left transition-colors',
        active ? 'bg-[#2A8CFF]' : 'bg-white hover:bg-black/[0.02]'
      )}
    >
      <SquircleStroke
        border={border.state}
        stroke={active ? '#FFFFFF' : NEUTRAL_STROKE}
        strokeWidth={active ? 2 : 1.5}
      />
      <SocialGlyph
        icon={icon}
        className={cn('relative z-10 size-12 shrink-0', active ? 'text-white' : 'text-[#2A8CFF]')}
      />
      <span className="relative z-10 min-w-0 flex-1">
        <span className={cn('block truncate text-base font-bold', active ? 'text-white' : 'text-text-primary')}>
          {icon.label}
        </span>
        <span className={cn('mt-0.5 block truncate text-sm', active ? 'text-white/75' : 'text-text-secondary')}>
          {active ? 'Selected — press Continue' : 'Tap to select'}
        </span>
      </span>
    </button>
  )
}

export function PickRow({
  active,
  onClick,
  label,
  sub,
  icon
}: {
  active: boolean
  onClick: () => void
  label: string
  sub?: string
  icon: ReactNode
}) {
  const clip = useSquircleClip<HTMLButtonElement>(14)
  const border = useSquircleBorder<HTMLButtonElement>(15)
  const setRef = useComposedRef(clip.ref, border.ref)
  return (
    <button
      ref={setRef}
      style={clip.style}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 px-3 py-3 text-left transition-colors',
        active ? 'bg-[#F4F9FF]' : 'bg-white hover:bg-black/[0.02]'
      )}
    >
      <SquircleStroke
        border={border.state}
        stroke={active ? ACTIVE_STROKE : NEUTRAL_STROKE}
        strokeWidth={active ? 2 : 1.5}
      />
      <span className="relative z-10 shrink-0">{icon}</span>
      <span className="relative z-10 min-w-0 flex-1">
        <span className="block truncate font-semibold text-text-primary">{label}</span>
        {sub ? <span className="block truncate text-xs text-text-secondary">{sub}</span> : null}
      </span>
      <span
        className={cn(
          'relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border',
          active ? 'border-[#2A8CFF] bg-[#2A8CFF] text-white' : 'border-black/20 text-transparent'
        )}
      >
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      </span>
    </button>
  )
}

/**
 * Form input whose border is the squircle path: the element is clipped to a
 * squircle and the stroke is an SVG sibling overlay (inputs can't contain
 * children), so focus is a stroke-color change — never a CSS border/ring.
 */
export function FormInput({
  className,
  onFocus,
  onBlur,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'ref'>) {
  const clip = useSquircleClip<HTMLInputElement>(14)
  const border = useSquircleBorder<HTMLInputElement>(15)
  const setRef = useComposedRef(clip.ref, border.ref)
  const [focused, setFocused] = useState(false)
  return (
    <span className="relative block w-full">
      <input
        ref={setRef}
        style={clip.style}
        {...props}
        onFocus={(event: FocusEvent<HTMLInputElement>) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event: FocusEvent<HTMLInputElement>) => {
          setFocused(false)
          onBlur?.(event)
        }}
        className={cn(
          'h-12 w-full bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none',
          className
        )}
      />
      <SquircleStroke
        border={border.state}
        stroke={focused ? ACTIVE_STROKE : NEUTRAL_STROKE}
        strokeWidth={focused ? 2 : 1.5}
      />
    </span>
  )
}

export function LoadingLine({ label }: { label: string }) {
  const clip = useSquircleClip<HTMLParagraphElement>(14)
  return (
    <p ref={clip.ref} style={clip.style} className="bg-black/5 p-4 text-sm text-text-secondary" aria-busy="true">
      {label}
    </p>
  )
}

export function EmptyLine({ label }: { label: string }) {
  const clip = useSquircleClip<HTMLParagraphElement>(14)
  const border = useSquircleBorder<HTMLParagraphElement>(15)
  const setRef = useComposedRef(clip.ref, border.ref)
  return (
    <p ref={setRef} style={clip.style} className="relative bg-white p-5 text-sm text-text-secondary">
      <SquircleStroke border={border.state} stroke={NEUTRAL_STROKE} />
      <span className="relative z-10">{label}</span>
    </p>
  )
}