import * as React from 'react'

import { cn } from '../../lib/utils'

const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-border/70 bg-card">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
})

const TableHeader = React.forwardRef(function TableHeader(
  { className, ...props },
  ref,
) {
  return (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  )
})

const TableBody = React.forwardRef(function TableBody(
  { className, ...props },
  ref,
) {
  return (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
})

const TableRow = React.forwardRef(function TableRow(
  { className, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border/60 transition-colors hover:bg-muted/40',
        className,
      )}
      {...props}
    />
  )
})

const TableHead = React.forwardRef(function TableHead(
  { className, ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      className={cn(
        'h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
})

const TableCell = React.forwardRef(function TableCell(
  { className, ...props },
  ref,
) {
  return (
    <td ref={ref} className={cn('px-4 py-3 align-middle', className)} {...props} />
  )
})

const TableCaption = React.forwardRef(function TableCaption(
  { className, ...props },
  ref,
) {
  return (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
})

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
