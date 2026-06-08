import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        featured: 'bg-accent text-accent-foreground shadow-soft',
        verified: 'bg-primary/10 text-primary',
        rent: 'bg-foreground/85 text-background',
        outline: 'border border-border text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
