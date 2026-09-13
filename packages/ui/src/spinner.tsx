import { LoaderCircle } from 'lucide-react'

import { cn } from './ui'

export type SpinnerProps = {
  className?: string
  label?: string
}

/**
 * Centered loading spinner, ported from ui-kit's page-spinner onto this
 * repo's stack (lucide + local cn). No visible text — the label is
 * screen-reader only — so loading states stay clean inside surfaces like
 * the dashboard form sheets.
 */
export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn('flex min-h-40 flex-1 items-center justify-center py-10', className)}
    >
      <LoaderCircle
        size={32}
        strokeWidth={2.25}
        aria-hidden="true"
        className="animate-spin text-[#2A8CFF]"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
