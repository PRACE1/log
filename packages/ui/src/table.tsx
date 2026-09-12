import * as React from 'react'

import { cn } from './ui'
import { useSquircleClip } from './squircle'

const HEADER_RADIUS = 14
const ROW_RADIUS = 12

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  const clip = useSquircleClip<HTMLTableSectionElement>(HEADER_RADIUS)

  return <thead ref={clip.ref} style={clip.style} className={cn('bg-[#EFF6FF]', className)} {...props} />
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={className} {...props} />
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export function TableRow({ className, ...props }: TableRowProps) {
  const clip = useSquircleClip<HTMLTableRowElement>(ROW_RADIUS)

  return (
    <tr
      ref={clip.ref}
      style={clip.style}
      className={cn('transition-colors even:bg-[#F4F9FF]', className)}
      {...props}
    />
  )
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary',
        className
      )}
      {...props}
    />
  )
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return <td className={cn('px-5 py-4 align-middle text-sm text-text-primary', className)} {...props} />
}