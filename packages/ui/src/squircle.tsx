import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type Ref
} from 'react'
import { getSvgPath } from 'figma-squircle'

import { cn } from './ui'

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (!ref) return
  if (typeof ref === 'function') {
    ref(node)
  } else {
    ;(ref as { current: T | null }).current = node
  }
}

/** Stable callback ref. Identity never changes, so React will not detach/reattach every render. */
export function useComposedRef<T>(...refs: Array<Ref<T> | undefined>) {
  const refsRef = useRef(refs)
  refsRef.current = refs

  return useCallback((node: T | null) => {
    for (const ref of refsRef.current) {
      assignRef(ref, node)
    }
  }, [])
}

export type SquircleCorners = {
  topLeft?: number
  topRight?: number
  bottomRight?: number
  bottomLeft?: number
}

function cornerOr(
  override: number | undefined,
  fallback: number
) {
  return override === undefined ? fallback : override
}

export function squirclePath(
  width: number,
  height: number,
  cornerRadius: number,
  cornerSmoothing = 1,
  corners?: SquircleCorners
) {
  if (width <= 0 || height <= 0) return undefined
  const radius = Math.min(cornerRadius, width / 2, height / 2)
  const topLeft = Math.min(cornerOr(corners?.topLeft, radius), width / 2, height / 2)
  const topRight = Math.min(cornerOr(corners?.topRight, radius), width / 2, height / 2)
  const bottomRight = Math.min(cornerOr(corners?.bottomRight, radius), width / 2, height / 2)
  const bottomLeft = Math.min(cornerOr(corners?.bottomLeft, radius), width / 2, height / 2)
  return getSvgPath({
    width,
    height,
    cornerRadius: radius,
    topLeftCornerRadius: topLeft,
    topRightCornerRadius: topRight,
    bottomRightCornerRadius: bottomRight,
    bottomLeftCornerRadius: bottomLeft,
    cornerSmoothing,
  })
}

export function squircleClipPath(
  width: number,
  height: number,
  cornerRadius: number,
  cornerSmoothing = 1,
  corners?: SquircleCorners
) {
  const path = squirclePath(width, height, cornerRadius, cornerSmoothing, corners)
  return path ? `path('${path}')` : undefined
}

export type SquircleBorderState = {
  width: number
  height: number
  path: string | undefined
}

export function useSquircleBorder<T extends HTMLElement>(
  cornerRadius: number,
  cornerSmoothing = 1,
  corners?: SquircleCorners
) {
  const [node, setNode] = useState<T | null>(null)
  const [state, setState] = useState<SquircleBorderState>({
    width: 0,
    height: 0,
    path: undefined,
  })
  const ref = useCallback((el: T | null) => {
    setNode(el)
  }, [])
  const topLeft = corners?.topLeft
  const topRight = corners?.topRight
  const bottomRight = corners?.bottomRight
  const bottomLeft = corners?.bottomLeft

  useLayoutEffect(() => {
    if (!node) return

    const update = () => {
      setState({
        width: node.offsetWidth,
        height: node.offsetHeight,
        path: squirclePath(
          node.offsetWidth,
          node.offsetHeight,
          cornerRadius,
          cornerSmoothing,
          { topLeft, topRight, bottomRight, bottomLeft }
        ),
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [
    node,
    cornerRadius,
    cornerSmoothing,
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
  ])

  return { ref, state }
}

export function useSquircleClip<T extends HTMLElement>(
  cornerRadius: number,
  cornerSmoothing = 1,
  corners?: SquircleCorners
) {
  const [node, setNode] = useState<T | null>(null)
  const [style, setStyle] = useState<CSSProperties>({})
  const ref = useCallback((el: T | null) => {
    setNode(el)
  }, [])
  const topLeft = corners?.topLeft
  const topRight = corners?.topRight
  const bottomRight = corners?.bottomRight
  const bottomLeft = corners?.bottomLeft

  useLayoutEffect(() => {
    if (!node) return

    const update = () => {
      const clipPath = squircleClipPath(
        node.offsetWidth,
        node.offsetHeight,
        cornerRadius,
        cornerSmoothing,
        { topLeft, topRight, bottomRight, bottomLeft }
      )
      if (clipPath) setStyle({ clipPath })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [
    node,
    cornerRadius,
    cornerSmoothing,
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
  ])

  return { ref, style }
}

const controlBase =
  'inline-flex min-h-10 items-center px-3 py-1 text-base transition-colors duration-150 focus-visible:shadow-[inset_0_0_0_2px_var(--header-focus)]'

interface SquircleLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  cornerRadius?: number
  track?: 'cta' | 'nav'
}

export const SquircleLink = forwardRef<HTMLAnchorElement, SquircleLinkProps>(
  function SquircleLink(
    { cornerRadius = 12, className = '', track = 'cta', ...props },
    forwardedRef
  ) {
    const { ref, style } = useSquircleClip<HTMLAnchorElement>(cornerRadius)
    const setRef = useComposedRef(ref, forwardedRef)
    return (
      <a
        ref={setRef}
        style={style}
        className={cn(
          'js-track js-click',
          track === 'nav' ? 'js-nav' : 'js-cta',
          controlBase,
          className
        )}
        {...props}
      />
    )
  }
)

interface SquircleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  cornerRadius?: number
}

export const SquircleButton = forwardRef<HTMLButtonElement, SquircleButtonProps>(
  function SquircleButton(
    { cornerRadius = 12, className = '', type = 'button', ...props },
    forwardedRef
  ) {
    const { ref, style } = useSquircleClip<HTMLButtonElement>(cornerRadius)
    const setRef = useComposedRef(ref, forwardedRef)
    return (
      <button
        ref={setRef}
        style={style}
        type={type}
        className={cn(controlBase, className)}
        {...props}
      />
    )
  }
)