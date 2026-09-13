import { useEffect, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button, useSquircleClip } from '@listeningkit/ui'

/**
 * Shared form surface for the dashboard form components. Renders a squircle
 * panel that fills the layout's third column (see DashboardFormSlot +
 * DashboardLayout) — in-flow, not an overlay — so every form (listings,
 * keywords, groups) shares one surface, one footer, one close path.
 *
 * Multi-step: pass `step` + `stepCount` (and `onBack` after step 1) and the
 * header shows a progress bar — the gray track renders from the very start
 * (empty until the total is known); `busy`/`confirmDisabled` let a step wait
 * on its async work (e.g. loading a platform's communities) before the
 * confirm button unlocks.
 */

const RADIUS = 28

const STEP_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }

export interface FormSheetProps {
  open: boolean
  title: string
  /** One-line context under the title; a node so callers can compose in badges/icons. */
  subtitle?: ReactNode
  /** 1-based current step. */
  step?: number
  /**
   * Total steps. The progress track renders whenever this is passed — pass
   * 0 before the total is known (e.g. pre platform pick) to show the empty
   * gray track from the very start.
   */
  stepCount?: number
  /** One-line hint for the current step (e.g. "Pick the group you're listening in"). */
  stepHint?: string
  children: ReactNode
  /** Primary action label; the button is hidden without one. */
  confirmLabel?: string
  confirmDisabled?: boolean
  /** Shows "Working…" in the confirm button while the step is resolving. */
  busy?: boolean
  onConfirm?: () => void
  onBack?: () => void
  /** Hide/disable the Back button on the first step. */
  backDisabled?: boolean
  onClose: () => void
}

function StepProgress({ step, stepCount }: { step: number; stepCount: number }) {
  // stepCount 0 = total not known yet (e.g. before the platform pick) —
  // render the empty gray track so the bar is visible from the very start.
  const fill = stepCount > 0 ? Math.min(100, Math.round((step / stepCount) * 100)) : 0
  return (
    <div className="px-6 pt-1" aria-hidden="true">
      <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
        <motion.div
          className="h-full rounded-full bg-[#2A8CFF]"
          initial={false}
          animate={{ width: `${fill}%` }}
          transition={STEP_TRANSITION}
        />
      </div>
    </div>
  )
}

export function DashboardFormSheet({
  open,
  title,
  subtitle,
  step,
  stepCount,
  stepHint,
  children,
  confirmLabel,
  confirmDisabled,
  busy,
  onConfirm,
  onBack,
  backDisabled,
  onClose
}: FormSheetProps) {
  // Escape closes the form; listeners only mount while it's open.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const multiStep = (stepCount ?? 0) > 1

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="h-full min-h-0"
    >
      <FormSheetSurface
        title={title}
        subtitle={subtitle}
        multiStep={multiStep}
        step={step}
        stepCount={stepCount}
        stepHint={stepHint}
        body={children}
        confirmLabel={confirmLabel}
        confirmDisabled={confirmDisabled}
        busy={busy}
        onConfirm={onConfirm}
        onBack={onBack}
        backDisabled={backDisabled}
        onClose={onClose}
      />
    </motion.div>
  )
}

function FormSheetSurface({
  title,
  subtitle,
  multiStep,
  step,
  stepCount,
  stepHint,
  body,
  confirmLabel,
  confirmDisabled,
  busy,
  onConfirm,
  onBack,
  backDisabled,
  onClose
}: {
  title: string
  subtitle?: ReactNode
  multiStep: boolean
  step?: number
  stepCount?: number
  stepHint?: string
  body: ReactNode
  confirmLabel?: string
  confirmDisabled?: boolean
  busy?: boolean
  onConfirm?: () => void
  onBack?: () => void
  backDisabled?: boolean
  onClose: () => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(RADIUS)

  return (
    <div
      ref={clip.ref}
      style={clip.style}
      className="flex h-full min-h-0 flex-col bg-white shadow-[0_24px_64px_-16px_rgba(15,30,51,0.35)]"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-text-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
        >
          <X size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>

      {stepCount !== undefined ? <StepProgress step={step ?? 0} stepCount={stepCount} /> : null}

      <div className="lk-no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        {stepHint ? <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{stepHint}</p> : null}
        {body}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
        <div className="flex items-center gap-2">
          {multiStep && onBack && !backDisabled ? (
            <Button type="button" variant="gray" size="lg" disabled={busy} onClick={onBack}>
              Back
            </Button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-black/[0.04] hover:text-text-primary disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {confirmLabel ? (
          <Button
            type="button"
            variant="blue"
            size="lg"
            shadow="hard"
            disabled={confirmDisabled || busy}
            onClick={onConfirm}
            className="font-bold text-white"
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}