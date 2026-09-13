import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useComposedRef, useSquircleClip } from '@listeningkit/ui'

/**
 * Uniform feed wrapper: squircles the card, scales oversized Paper designs
 * down to fit the column (never up), and pads the mat so inset drop-shadows
 * survive the clip. Truncation lives on the card text nodes themselves.
 */

const FRAME_PADDING = 16 // must match the p-4 mat below

/** Full-size design widths in px for each platform's Paper card. */
export const CARD_NATURAL_WIDTHS = {
  facebook: 713.42,
  x: 484,
  reddit: 864
} as const

export function FeedCardFrame({
  naturalWidth,
  radius = 24,
  children
}: {
  /** Full-size design width in px (Reddit 864, Facebook 713.42, X 484). */
  naturalWidth: number
  radius?: number
  children: ReactNode
}) {
  const clip = useSquircleClip<HTMLDivElement>(radius)
  const outerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const setOuterRef = useComposedRef(outerRef, clip.ref)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const update = () => {
      const available = outer.clientWidth - FRAME_PADDING * 2
      const next = outer.clientWidth > 0 ? Math.min(1, available / naturalWidth) : 1
      setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next))
      const nextHeight = Math.max(0, Math.round(inner.offsetHeight * next + FRAME_PADDING * 2))
      setHeight((prev) => (prev === nextHeight ? prev : nextHeight))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [naturalWidth])

  return (
    <div ref={setOuterRef} style={{ ...clip.style, height }} className="w-full shrink-0 overflow-hidden bg-white">
      <div className="p-4">
        <div
          ref={innerRef}
          style={{ width: naturalWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
