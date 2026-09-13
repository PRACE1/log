import type { ReactNode } from 'react'
import { useSquircleClip } from '@listeningkit/ui'

export type DashboardTabAccent = 'blue' | 'sky' | 'amber' | 'red' | 'emerald'

// Selected wash + icon-box color always match: a tab never pairs a generic
// light-blue wash with a differently colored box.
const ACCENT: Record<DashboardTabAccent, { wash: string; box: string }> = {
  blue: { wash: 'bg-brand-600/10 text-brand-600', box: 'bg-[#2A8CFF]' },
  sky: { wash: 'bg-sky-500/10 text-sky-600', box: 'bg-sky-500' },
  amber: { wash: 'bg-amber-500/10 text-amber-600', box: 'bg-amber-500' },
  red: { wash: 'bg-red-600/10 text-red-600', box: 'bg-red-600' },
  emerald: { wash: 'bg-emerald-600/10 text-emerald-600', box: 'bg-emerald-600' },
}

/**
 * Shared tab button: rounded-xl row, squircle icon box, label — the shape
 * used by the Groups platform tabs, the Messages platform tabs, the
 * Settings section tabs and the analytics type filters. Pass a bare glyph
 * (size-4); selected coloring is applied inside.
 */
export function DashboardTab({
  label,
  icon,
  active,
  onClick,
  accent = 'blue',
  endAdornment,
}: {
  label: string
  icon: ReactNode
  active: boolean
  onClick?: () => void
  accent?: DashboardTabAccent
  /** Trailing content that never takes the selected tint (e.g. a Soon pill). */
  endAdornment?: ReactNode
}) {
  const clip = useSquircleClip<HTMLSpanElement>(9)
  const tones = ACCENT[accent]

  const inner = (
    <>
      <span
        ref={clip.ref}
        style={clip.style}
        className={`flex size-7 items-center justify-center ${active ? tones.box : 'bg-black/5'}`}
      >
        <span className={active ? 'text-white' : 'text-text-secondary'}>{icon}</span>
      </span>
      {label}
      {endAdornment}
    </>
  )

  const className = `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold ${
    active ? tones.wash : 'text-text-secondary'
  }`

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={className}>
      {inner}
    </button>
  ) : (
    <span className={className}>{inner}</span>
  )
}
