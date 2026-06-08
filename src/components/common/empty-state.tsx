import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = SearchX,
}: {
  title: string
  description?: string
  action?: { label: string; href: string }
  icon?: typeof SearchX
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="size-7" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      )}
      {action && (
        <Button asChild className="mt-6" variant="outline">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
