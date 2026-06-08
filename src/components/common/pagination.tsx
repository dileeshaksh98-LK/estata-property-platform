import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  total,
  pageSize,
  makeHref,
}: {
  page: number
  total: number
  pageSize: number
  makeHref: (page: number) => string
}) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null

  const window = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1,
  )

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PageLink href={makeHref(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous">
        <ChevronLeft className="size-4" />
      </PageLink>
      {window.map((p, i) => {
        const gap = i > 0 && p - window[i - 1] > 1
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-muted-foreground">…</span>}
            <Link
              href={makeHref(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'grid size-10 place-items-center rounded-xl text-sm font-medium transition-colors',
                p === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-secondary',
              )}
            >
              {p}
            </Link>
          </span>
        )
      })}
      <PageLink href={makeHref(Math.min(pages, page + 1))} disabled={page === pages} aria-label="Next">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  )
}

function PageLink({
  href,
  disabled,
  children,
  ...rest
}: { href: string; disabled?: boolean } & React.ComponentProps<typeof Link>) {
  if (disabled)
    return (
      <span className="grid size-10 cursor-not-allowed place-items-center rounded-xl border border-border text-muted-foreground/40">
        {children}
      </span>
    )
  return (
    <Link
      href={href}
      {...rest}
      className="grid size-10 place-items-center rounded-xl border border-border transition-colors hover:bg-secondary"
    >
      {children}
    </Link>
  )
}
