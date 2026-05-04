import * as React from 'react'

import { cn } from '../../lib/utils'

const Badge = React.forwardRef(function Badge({ className, variant = 'default', ...props }, ref) {
  return (
    <span
      ref={ref}
      data-variant={variant}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        variant === 'outline'
          ? 'border border-border text-muted-foreground'
          : 'bg-primary/10 text-primary',
        className,
      )}
      {...props}
    />
  )
})

export { Badge }
