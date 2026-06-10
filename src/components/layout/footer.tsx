import Link from 'next/link'
import { SITE } from '@/lib/constants'

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      ['Buy property', '/properties?listing=sale'],
      ['Rent property', '/properties?listing=rent'],
      ['Land for sale', '/properties?type=land'],
      ['New apartments', '/properties?type=apartment'],
    ],
  },
  {
    title: 'For sellers',
    links: [
      ['Post an ad', '/dashboard/listings/new'],
      ['Seller dashboard', '/dashboard'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['How it works', '/how-it-works'],
      ['Contact', '/contact'],
      ['Careers', '/careers'],
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-semibold">
              e
            </span>
            <span className="font-display text-xl font-semibold">{SITE.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
            {SITE.description}
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-semibold">{col.title}</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/sitemap.xml" className="hover:text-foreground">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
