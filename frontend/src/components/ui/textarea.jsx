import * as React from 'react'

import { cn } from '../../lib/utils'

const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm shadow-black/5 transition focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
})

export { Textarea }
