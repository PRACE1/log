import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@listeningkit/ui'
import { FluidCanvas } from '@dilukangelo/fluidkit/react'
import { threshold, type Fluid } from '@dilukangelo/fluidkit'
import { MorphLine } from './MorphLine'

export const FILL_DURATION_MS = 5000
// Reveal the logo once the pour is nearly done; it flips white -> blue at 100%.
const LOGO_AT = 80
const WHITE = '#ffffff'

// Flat 2D pure-white liquid over the dark onboarding backdrop. Single low-cutoff
// level so even thin dye reads solid — no lighting, no bubbles, crisp edges.
const WHITE_LIQUID = threshold({
  levels: [{ cutoff: 0.18, color: WHITE }],
  background: 'transparent',
  softness: 1,
})

// Controller: drives progress 0 -> 100 over `durationMs` and reports readiness.
export function useFillController(durationMs = FILL_DURATION_MS) {
  const [progress, setProgress] = useState(0)
  const ready = progress >= 100

  useEffect(() => {
    let raf = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const span = reduced ? 1 : durationMs
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / span)
      setProgress(Math.floor(t * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs])

  return { progress, ready }
}

export function ReadyFill({ onReady }: { onReady?: () => void }) {
  const { progress, ready } = useFillController()
  const showLogo = progress >= LOGO_AT
  const navigate = useNavigate()
  const fluidRef = useRef<Fluid | null>(null)
  const risingRef = useRef(true)
  const [settled, setSettled] = useState(false)
  const frameRef = useRef(0) // throttle emission to every 2nd frame
  const frontRef = useRef(0) // fill front 0..1, mirrored from progress for onFrame

  useEffect(() => {
    frontRef.current = progress / 100
  }, [progress])

  // show that it's ready: stop the rise, flood solid, then freeze the sim and
  // sit on flat white — it's a loader, not an ambient background
  useEffect(() => {
    if (!ready) return
    risingRef.current = false
    const f = fluidRef.current
    if (f) {
      // flood the whole screen solid: dense overlapping grid so the final
      // state is one continuous body, not columns
      for (let ix = 0; ix < 8; ix++) {
        for (let iy = 0; iy < 8; iy++) {
          f.splat(0.06 + ix * 0.125, 0.06 + iy * 0.125, 0, 0, { color: WHITE, radius: 0.3 })
        }
      }
    }
    onReady?.()
    // let the flood render, then freeze and fade in the flat white end state
    const id = window.setTimeout(() => {
      fluidRef.current?.pause()
      setSettled(true)
    }, 400)
    return () => window.clearTimeout(id)
  }, [ready, onReady])

  const handleSimReady = useCallback((f: Fluid) => {
    fluidRef.current = f
    // opening band along the bottom edge
    for (let i = 0; i < 3; i++) {
      f.splat(0.25 + i * 0.25, 0.08, 0, 120, { color: WHITE, radius: 0.25 })
    }
  }, [])

  // rise driver — options are read once at mount, so this only reads refs.
  // lays a solid band of overlapping blobs along the fill front as it sweeps
  // bottom -> top, so they merge into one body instead of stretching into
  // strands. curl stays near zero so nothing filaments.
  const handleFrame = useCallback(() => {
    if (!risingRef.current) return
    frameRef.current += 1
    if (frameRef.current % 2 !== 0) return
    const f = fluidRef.current
    if (!f) return
    const front = Math.max(0.05, Math.min(0.96, frontRef.current))
    for (let i = 0; i < 10; i++) {
      const x = Math.min(0.98, Math.max(0.02, (i + 0.5) / 10 + (Math.random() - 0.5) * 0.04))
      f.splat(x, front + (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 30, 40 + Math.random() * 50, {
        color: WHITE,
        radius: 0.2,
      })
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="status"
      aria-label={ready ? 'ListeningKit ready' : 'Rising'}
    >
      {/* live GPU fluid: white rise with reverse gravity, splashes, and wanderers */}
      <FluidCanvas
        className="absolute inset-0 h-full w-full"
        render={WHITE_LIQUID}
        gravity={-40}
        densityDissipation={1}
        curl={3}
        speed={0.6}
        splatRadius={0.22}
        dyeResolution={512}
        emitters={{
          pointer: { color: WHITE, intensity: 0.4 },
        }}
        onFrame={handleFrame}
        onReady={handleSimReady}
      />

      {/* flat white end state — fades in once the sim freezes */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-500 ${
          settled ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* spinning edge halo — appears with the logo reveal: blue/white
          outward stripes rotating in a ring around the screen edges,
          blue strongest at the edges melting to white inward */}
      <div
        aria-hidden="true"
        className={`lk-edge-halo z-[5] transition-opacity duration-1000 ${
          showLogo ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="lk-edge-halo-spinner" />
        <div className="lk-edge-halo-fade" />
      </div>

      {/* torph copy while rising */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center p-8 transition-opacity duration-500 ${
          showLogo ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <MorphLine
          className={`max-w-3xl text-3xl font-bold leading-tight transition-colors duration-1000 sm:text-5xl ${
            progress >= 50 ? 'text-[#2A8CFF]' : 'text-white'
          }`}
        />
      </div>

      {/* logo reveal — centered lockup: mark left, text column right, button on its own row */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 p-8 text-center transition-all delay-150 duration-700 ${
          showLogo ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center gap-4 text-left">
          <img src="/logo.svg" alt="ListeningKit logo" className="size-20 rounded-[22px] object-contain" />
          <div className="flex flex-col gap-1">
            <p
              className={`text-4xl font-bold transition-colors duration-1000 sm:text-5xl ${
                ready ? 'text-[#2A8CFF]' : 'text-white'
              }`}
            >
              ListeningKit
            </p>
            <p
              className={`text-sm transition-colors duration-1000 ${
                ready ? 'text-[#2A8CFF]/70' : 'text-white/70'
              }`}
            >
              live social listening
            </p>
          </div>
        </div>
        <div
          className={`transition-all duration-700 ${
            ready ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          }`}
        >
          <Button
            type="button"
            variant="blue"
            size="xl"
            shadow="hard"
            onClick={() => navigate('/dashboard')}
            className="h-14 rounded-xl px-10 font-bold text-white"
          >
            Start listening
          </Button>
        </div>
      </div>
    </div>
  )
}
