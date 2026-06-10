import type { ReactNode } from 'react'

/** Shared hero + prose layout for static/company pages. */
export function PageShell({
  eyebrow, title, intro, children,
}: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <div className="relative">
      <div className="grain mesh absolute inset-x-0 top-0 h-72" aria-hidden />
      <div className="container relative max-w-3xl pb-20 pt-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl text-balance">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">{intro}</p>
        <div className="mt-12 space-y-10">{children}</div>
      </div>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}
