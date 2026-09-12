import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useComposedRef, useSquircleBorder, useSquircleClip } from '@listeningkit/ui'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'

const SQUIRCLE_RADIUS = 28

export function DashboardLayout() {
  const clip = useSquircleClip<HTMLDivElement>(SQUIRCLE_RADIUS)
  const border = useSquircleBorder<HTMLDivElement>(SQUIRCLE_RADIUS)
  const toggleClip = useSquircleClip<HTMLButtonElement>(14)
  const panelRef = useComposedRef(clip.ref, border.ref)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-[#2A8CFF] p-4 sm:p-6">
      <div className="relative mx-auto max-w-[1600px]">
        <div
          ref={panelRef}
          style={clip.style}
          className="flex h-[calc(100vh_-_2rem)] supports-[height:100dvh]:h-[calc(100dvh_-_2rem)] overflow-hidden bg-[#FBFCFE] text-text-primary sm:h-[calc(100vh_-_3rem)]"
        >
          <DashboardSidebar collapsed={sidebarCollapsed} onToggleCollapsed={setSidebarCollapsed} />

          <div className="relative flex min-h-0 flex-1 flex-col bg-transparent">
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

            <main className="lk-no-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto bg-[#FBFCFE] px-6 pb-0 pt-6 sm:px-8 sm:pb-0 sm:pt-8">
              <Outlet />
            </main>
          </div>
        </div>

        {border.state.path && (
          <svg
            className="pointer-events-none absolute inset-0 block"
            width={border.state.width}
            height={border.state.height}
            viewBox={`0 0 ${border.state.width} ${border.state.height}`}
            style={{ overflow: 'visible' }}
            aria-hidden="true"
          >
            <path d={border.state.path} fill="none" stroke="#FBFCFE" strokeWidth={10} />
          </svg>
        )}
      </div>
    </div>
  )
}
