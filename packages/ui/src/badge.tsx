import type { HTMLAttributes, ReactNode } from 'react'
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

const badgeBase = 'inline-flex items-center gap-1.5 whitespace-nowrap border font-medium'

const badgeVariants = cva(badgeBase, {
  variants: {
    variant: {
      // Compact legacy pill shapes.
      neutral: 'rounded-md border-black/10 bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-text-secondary',
      muted: 'rounded-md border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500',
      success: 'rounded-md border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700',
      danger: 'rounded-md border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700',
      warning: 'rounded-md border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700',
      info: 'rounded-md border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700',
      brand: 'rounded-md border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600',
      solid: 'rounded-md border-text-primary bg-text-primary px-2.5 py-0.5 text-xs font-semibold text-white',
      // Select-trigger chrome using the same sizing recipe as the other table
      // badges. `color` supplies the status border/background/text.
      trigger: 'rounded-md px-2.5 py-0.5 text-xs font-semibold'
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
  /** Status color for the `trigger` variant; label shares it. */
  color?: BadgeColor
  /** Renders a small leading dot in the badge's own color. */
  dot?: boolean
  /** Small leading icon rendered before the dot/label. */
  icon?: ReactNode
}

export function Badge({ className, variant, color, dot = false, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, color }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {icon ? <span aria-hidden="true" className="flex items-center">{icon}</span> : null}
      {children}
    </span>
  )
}