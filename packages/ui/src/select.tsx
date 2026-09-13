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
  useRole,
  type MiddlewareArguments,
  type MiddlewareReturn
} from '@floating-ui/react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from './ui'
import { squircleClipPath, useComposedRef, useSquircleBorder, useSquircleClip } from './squircle'

const RADIUS = 16
// ui-kit header timing: soft ease with a longer tail
const SURFACE_TRANSITION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }
const ITEM_EASE = { duration: 0.2, ease: 'easeOut' as const }

export interface SelectOption {
  value: string
  label: React.ReactNode
  /** Small glyph rendered in the option's icon box (e.g. a platform mark). */
  icon?: React.ReactNode
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  /** Match the floating panel to the trigger width. */
  matchWidth?: boolean
  placeholder?: string
  /** Optional content rendered before the label in the trigger (e.g. a platform icon). */
  icon?: React.ReactNode
  /**
   * Optional footer pinned to the bottom of the floating menu (below the
   * scrollable options, always visible) — e.g. a type-to-add row. Lives
   * inside the portal, so it floats with the menu instead of the page flow.
   */
  menuFooter?: React.ReactNode
  className?: string
  'aria-label'?: string
}

export function Select({
  options,
  value,
  onChange,
  matchWidth = false,
  placeholder = 'Select…',
  icon,
  menuFooter,
  className,
  'aria-label': ariaLabel
}: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(value ?? '')
  const selectRootRef = React.useRef<HTMLSpanElement | null>(null)
  const nodeRef = React.useRef<HTMLDivElement | null>(null)

  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open,
    onOpenChange: (next: boolean) => {
      if (next) {
        setHighlight(value ?? options[0]?.value ?? '')
      }
      setOpen(next)
    },
    placement: 'bottom-start',
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
      ...(matchWidth
        ? [
            {
              name: 'matchTriggerWidth',
              fn: (state: MiddlewareArguments): MiddlewareReturn => {
                state.elements.floating.style.width = `${Math.max(state.rects.reference.width, 160)}px`
                return { x: state.x, y: state.y, data: {} }
              }
            }
          ]
        : [])
    ]
  })

  const toggle = useClick(context)
  const dismiss = useDismiss(context, { escapeKey: true })
  const role = useRole(context, { role: 'listbox' })
  const { getReferenceProps, getFloatingProps } = useInteractions([toggle, dismiss, role])

  // Re-sync the squircle clip whenever the layout-driven height changes mid-animation,
  // and when the trigger resizes while the menu is open.
  const syncClip = React.useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    const clipPath = squircleClipPath(el.offsetWidth, el.offsetHeight, RADIUS)
    if (clipPath) el.style.clipPath = clipPath
  }, [])

  React.useEffect(() => {
    if (!open) return
    const el = selectRootRef.current
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
    const values = options.map((o) => o.value)
    const index = values.indexOf(highlight)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight(values[Math.min(index + 1, values.length - 1)] ?? highlight)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight(values[Math.max(index - 1, 0)] ?? highlight)
    } else if (event.key === 'Enter' && index !== -1) {
      event.preventDefault()
      setOpen(false)
      onChange?.(highlight)
    }
  }

  // Keep the highlighted item scrolled into view.
  React.useEffect(() => {
    if (!open) return
    const el = nodeRef.current?.querySelector<HTMLElement>(`[data-select-value="${CSS.escape(highlight)}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  const selected = options.find((o) => o.value === value)
  const triggerIcon = icon ?? selected?.icon

  const referenceProps = getReferenceProps({
    'aria-label':
      ariaLabel ?? (typeof selected?.label === 'string' ? selected.label : undefined),
    onKeyDown: handleKeyDown
  })

  return (
    <span ref={selectRootRef} className="relative inline-flex">
      <button
        type="button"
        ref={refs.setReference}
        {...referenceProps}
        aria-expanded={open}
        className={cn(
          'inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-text-primary outline-none transition-colors',
          'hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-brand-500/40',
          className
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {triggerIcon ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-[#F4F9FF] text-[#288DFF]">
              {triggerIcon}
            </span>
          ) : null}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.25}
          className={cn('shrink-0 stroke-current text-text-secondary transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      <FloatingPortal root={typeof document !== 'undefined' ? document.body : undefined}>
        <AnimatePresence initial={false}>
          {open ? (
            <SelectMenuSurface
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
              activeValue={highlight}
              selectedValue={value}
              options={options}
              footer={menuFooter}
              onHover={setHighlight}
              onSelect={(next) => {
                setOpen(false)
                onChange?.(next)
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
  activeValue: string
  selectedValue?: string
  options: SelectOption[]
  footer?: React.ReactNode
  onHover: (value: string) => void
  onSelect: (value: string) => void
}

const SelectMenuSurface = React.forwardRef<HTMLDivElement, SurfaceProps>(function SelectMenuSurface(
  { floatingStyle, floatingProps, syncClip, activeValue, selectedValue, options, footer, onHover, onSelect },
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
      className="z-50 w-max min-w-[180px] max-w-[calc(100vw-16px)] overflow-hidden bg-white"
    >
      <div
        ref={border.ref}
        className="relative"
      >
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
        {options.map((option) => {
          const active = activeValue === option.value
          return (
            <div
              key={option.value}
              data-select-value={option.value}
              role="option"
              aria-selected={selectedValue === option.value}
              tabIndex={-1}
              onMouseMove={() => onHover(option.value)}
              onClick={() => onSelect(option.value)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl p-2',
                active ? 'bg-black/[0.04]' : ''
              )}
            >
              {option.icon}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                {option.label}
              </span>
              {selectedValue === option.value ? (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={ITEM_EASE}
                  className="stroke-current text-brand-600"
                >
                  <Check size={16} strokeWidth={2.25} />
                </motion.span>
              ) : null}
            </div>
          )
        })}
      </div>
      {footer ? <div className="relative border-t border-black/5 p-2">{footer}</div> : null}
      </div>
    </motion.div>
  )
})