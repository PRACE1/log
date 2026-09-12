import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './ui'

export type BadgeColor = 'success' | 'warning' | 'info' | 'danger' | 'muted'

const badgeColors: Record<BadgeColor, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  muted: 'border-slate-200 bg-slate-50 text-slate-500'
}

// Each status color keeps its border correlated with its background so the
// badge reads as one tinted surface, not white with an accent.
const badgeColorCompounds = [
  { variant: 'trigger' as const, color: undefined, className: 'border-black/10 bg-white text-text-primary' },
  ...(Object.keys(badgeColors) as BadgeColor[]).map((color) => ({
    variant: 'trigger' as const,
    color,
    className: badgeColors[color]
  }))
]

const badgeBase = 'inline-flex items-center gap-1.5 whitespace-nowrap font-medium'

const badgeVariants = cva(badgeBase, {
  variants: {
    variant: {
      // Compact legacy pill shapes.
      neutral: 'rounded-md bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-text-secondary',
      muted: 'rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500',
      success: 'rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700',
      danger: 'rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700',
      warning: 'rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700',
      info: 'rounded-md bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700',
      brand: 'rounded-md bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600',
      solid: 'rounded-md bg-text-primary px-2.5 py-0.5 text-xs font-semibold text-white',
      // Select-trigger chrome (white bg + border) using the same sizing recipe as
      // the other table badges. `color` supplies the status color.
      trigger: 'rounded-md border px-2.5 py-0.5 text-xs font-semibold'
    },
    color: {
      success: 'text-emerald-700',
      warning: 'text-amber-700',
      info: 'text-sky-700',
      danger: 'text-red-700',
      muted: 'text-slate-500'
    }
  },
  compoundVariants: badgeColorCompounds,
  defaultVariants: {
    variant: 'neutral'
  }
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Renders a small leading dot in the badge's own color. */
  dot?: boolean
  /** Status color for the `trigger` variant; dot and label share it. */
  color?: BadgeColor
}

export function Badge({ className, variant, color, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, color }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}