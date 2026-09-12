import * as React from 'react'
import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  type MiddlewareArguments
} from '@floating-ui/react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { MoreVertical } from 'lucide-react'

import { cn } from './ui'
import { squircleClipPath, useComposedRef, useSquircleBorder, useSquircleClip } from './squircle'

const RADIUS = 16
// Same timing as the Select surface so menus and selects feel identical.
const SURFACE_TRANSITION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onSelect?: () => void
}

export interface DropdownProps {
  items: DropdownItem[]
  className?: string
  'aria-label'?: string
}

/**
 * Ellipsis row-action menu. Same floating-panel logic as Select — squircle
 * clip + border stroke, portal, height-open animation — with `bottom-end`
 * placement so menus open back into the panel from right-aligned columns.
 */
export function Dropdown({ items, className, 'aria-label': ariaLabel }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState('')
  const rootRef = React.useRef<HTMLSpanElement | null>(null)
  const nodeRef = React.useRef<HTMLDivElement | null>(null)

  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open,
    onOpenChange: (next: boolean) => {
      if (next) setHighlight(items[0]?.id ?? '')
      setOpen(next)
    },
    placement: 'bottom-end',
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, {
        ancestorScroll: true,
        ancestorResize: true,
        elementResize: true
      }),
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      {
        name: 'minMenuWidth',
        fn: (state: MiddlewareArguments) => {
          state.elements.floating.style.width = `${Math.max(state.rects.reference.width, 180)}px`
          return { x: state.x, y: state.y, data: {} }
        }
      }
    ]
  })

  const toggle = useClick(context)
  const dismiss = useDismiss(context, { escapeKey: true })
  const { getReferenceProps, getFloatingProps } = useInteractions([toggle, dismiss])

  // Same clip re-sync as Select: the surface height animates, so the squircle
  // clip must be recomputed as it grows.
  const syncClip = React.useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    const clipPath = squircleClipPath(el.offsetWidth, el.offsetHeight, RADIUS)
    if (clipPath) el.style.clipPath = clipPath
  }, [])

  React.useEffect(() => {
    if (!open) return
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => syncClip())
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, syncClip])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    const ids = items.map((item) => item.id)
    const index = ids.indexOf(highlight)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight(ids[Math.min(index + 1, ids.length - 1)] ?? highlight)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight(ids[Math.max(index - 1, 0)] ?? highlight)
    } else if (event.key === 'Enter' && index !== -1) {
      event.preventDefault()
      setOpen(false)
      items[index]?.onSelect?.()
    }
  }

  // Keep the highlighted item scrolled into view.
  React.useEffect(() => {
    if (!open) return
    const el = nodeRef.current?.querySelector<HTMLElement>(`[data-dropdown-id="${CSS.escape(highlight)}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  // Same shape as Select: fold the interaction props (including the useClick
  // `onClick` toggle) into one spread so a custom handler can call through to
  // it instead of replacing it.
  const referenceProps = getReferenceProps({
    'aria-label': ariaLabel ?? 'Row actions',
    onKeyDown: handleKeyDown
  })

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        ref={refs.setReference}
        {...referenceProps}
        aria-expanded={open}
        onClick={(event) => {
          // Call the interaction handler first — it owns the open/close toggle.
          // floating-ui's reference props type the handler as an opaque `{}`, so
          // narrow it before invoking.
          const toggle = referenceProps.onClick as ((e: React.MouseEvent) => void) | undefined
          toggle?.(event)
          // Don't let a row-level click handler also fire for the menu button.
          event.stopPropagation()
          if (!open) setHighlight(items[0]?.id ?? '')
        }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary outline-none transition-colors',
          'hover:bg-black/[0.04] hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-500/40',
          className
        )}
      >
        <MoreVertical size={16} strokeWidth={
          2.25
        } aria-hidden="true" />
      </button>

      <FloatingPortal root={typeof document !== 'undefined' ? document.body : undefined}>
        <AnimatePresence initial={false}>
          {open ? (
            <DropdownMenuSurface
              ref={(node: HTMLDivElement | null) => {
                refs.setFloating(node)
                nodeRef.current = node
              }}
              floatingStyle={{
                ...floatingStyles,
                // The portal element mounts before the first autoUpdate measure
                // resolves; without this it flashes at (0,0) for a frame.
                visibility: isPositioned ? undefined : 'hidden'
              }}
              floatingProps={getFloatingProps()}
              syncClip={syncClip}
              activeId={highlight}
              items={items}
              onHover={setHighlight}
              onSelect={(id) => {
                setOpen(false)
                items.find((item) => item.id === id)?.onSelect?.()
              }}
            />
          ) : null}
        </AnimatePresence>
      </FloatingPortal>
    </span>
  )
}

interface SurfaceProps {
  floatingStyle: React.CSSProperties
  floatingProps: HTMLMotionProps<'div'>
  syncClip: () => void
  activeId: string
  items: DropdownItem[]
  onHover: (id: string) => void
  onSelect: (id: string) => void
}

const DropdownMenuSurface = React.forwardRef<HTMLDivElement, SurfaceProps>(function DropdownMenuSurface(
  { floatingStyle, floatingProps, syncClip, activeId, items, onHover, onSelect },
  forwardedRef
) {
  const clip = useSquircleClip<HTMLDivElement>(RADIUS)
  const border = useSquircleBorder<HTMLDivElement>(RADIUS + 1)
  const setRef = useComposedRef(forwardedRef, clip.ref)

  return (
    <motion.div
      ref={setRef}
      style={floatingStyle}
      {...floatingProps}
      initial={{ height: 0 }}
      animate={{ height: 'auto' }}
      exit={{ height: 0 }}
      transition={SURFACE_TRANSITION}
      onUpdate={syncClip}
      onAnimationStart={syncClip}
      onAnimationComplete={syncClip}
      className="w-full overflow-hidden bg-white"
    >
      <div ref={border.ref} aria-hidden="true" className="relative">
        <svg
          width={border.state.width}
          height={border.state.height}
          viewBox={border.state.path ? `0 0 ${border.state.width} ${border.state.height}` : undefined}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible"
        >
          {border.state.path ? (
            <path d={border.state.path} fill="none" stroke="#E4E7EC" strokeWidth={1} />
          ) : null}
        </svg>
        <div className="relative max-h-72 overflow-y-auto p-2">
          {items.map((item) => {
            const active = activeId === item.id
            return (
              <div
                key={item.id}
                data-dropdown-id={item.id}
                role="menuitem"
                tabIndex={-1}
                onMouseMove={() => onHover(item.id)}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors',
                  active ? 'bg-black/[0.04]' : '',
                  item.danger ? 'text-red-600' : 'text-text-primary'
                )}
              >
                {item.icon ? (
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-lg',
                      active ? (item.danger ? 'bg-red-600 text-white' : 'bg-[#2A8CFF] text-white') : item.danger ? 'bg-red-50 text-red-600' : 'bg-[#F4F9FF] text-[#288DFF]'
                    )}
                  >
                    {item.icon}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
})