import { memo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useComposedRef, useSquircleClip } from '@listeningkit/ui'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { DashboardFormProvider } from './DashboardFormSlot'

const SQUIRCLE_RADIUS = 28

export function DashboardLayout() {
  const clip = useSquircleClip<HTMLDivElement>(SQUIRCLE_RADIUS)
  const toggleClip = useSquircleClip<HTMLButtonElement>(14)
  const panelRef = useComposedRef(clip.ref)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // The form overlay: pages register their form node when open, null when
  // closed. Rendered ABOVE the layout at a higher z-level, never in-flow —
  // the dashboard underneath keeps its shape (sidebar | content) with zero
  // reflow while a form is up.
  const [formSlot, setFormSlot] = useState<ReactNode | null>(null)

  return (
    <DashboardFormProvider value={setFormSlot}>
    <div className="h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-[#2A8CFF] p-4 sm:p-6">
      <div className="relative mx-auto max-w-[1600px]">
        <div
          ref={panelRef}
          style={clip.style}
          className="relative flex h-[calc(100vh_-_2rem)] supports-[height:100dvh]:h-[calc(100dvh_-_2rem)] overflow-hidden bg-[#FBFCFE] text-text-primary sm:h-[calc(100vh_-_3rem)]"
        >
          <DashboardSidebar collapsed={sidebarCollapsed} onToggleCollapsed={setSidebarCollapsed} />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!sidebarCollapsed}
              ref={toggleClip.ref}
              style={toggleClip.style}
              className="absolute -left-3.5 top-1/2 z-10 hidden size-7 -translate-y-1/2 items-center justify-center border border-black/10 bg-white text-text-secondary outline-none transition-colors duration-150 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-500/40 sm:flex"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={15} strokeWidth={2.25} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={15} strokeWidth={2.25} aria-hidden="true" />
              )}
            </button>
            <DashboardHeader />

            <div className="flex min-h-0 flex-1 items-stretch">
              <main className="lk-no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto bg-[#FBFCFE] px-6 pb-0 pt-6 sm:px-8 sm:pb-0 sm:pt-8">
                <Outlet />
              </main>
            </div>
          </div>

          {/* The form floats above the layout at a higher z-level: a dark
            low-opacity scrim covering the whole layout, with the form docked
            in the third column on the right (same 400px + padding, same
            spot) — the dashboard underneath keeps its full width with zero
            reflow. The panel lives in a memoized child so page re-renders
            (polling, filters, per-card busy states) never re-render it. */}
          <FormOverlay formSlot={formSlot} onDismiss={() => setFormSlot(null)} />
        </div>
      </div>
    </div>
    </DashboardFormProvider>
  )
}

/**
 * The dashboard's form overlay. Memoized: it only re-renders when the
 * registered form node changes identity, never when the page underneath
 * re-renders. Covers the whole layout at a higher z-level with a dark
 * low-opacity scrim, and docks the form in the third column on the right
 * (same 400px width and padding, same spot) — the dashboard beneath never
 * reflows. The layer is click-through except for the panel itself; the
 * form's own Cancel/Escape/confirm paths close it.
 */
const FormOverlay = memo(function FormOverlay({
  formSlot,
  onDismiss
}: {
  formSlot: ReactNode | null
  onDismiss: () => void
}) {
  // Inset + squircle-clipped to sit *inside* the panel: the scrim covers
  // only the inner dashboard layout, never the panel's squircle edge. The
  // scrim is the backdrop-click close path (same as Cancel/Escape) — the
  // form panel is a sibling, so clicks inside it never reach it.
  const overlayClip = useSquircleClip<HTMLDivElement>(20)
  return (
    <AnimatePresence initial={false}>
      {formSlot ? (
        <motion.div
          key="form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-2 z-30"
          aria-hidden={false}
        >
          <div ref={overlayClip.ref} style={overlayClip.style} className="relative h-full w-full overflow-hidden">
            <div
              className="absolute inset-0 bg-[#0A1830]/45"
              aria-hidden="true"
              onClick={onDismiss}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            />
            <div className="absolute inset-y-0 right-0 py-6 pr-6 sm:py-8 sm:pr-8">
              <div className="pointer-events-auto h-full w-[400px]">{formSlot}</div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
})
