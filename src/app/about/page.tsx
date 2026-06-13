import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { PageShell, Section } from '@/components/common/page-shell'
import { Button } from '@/components/ui/button'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About',
  description: `Why ${SITE.name} exists: a transparent, modern marketplace for buying, selling and renting property across Sri Lanka.`,
  alternates: { canonical: '/about' },
  openGraph: { title: `About · ${SITE.name}`, description: `The story and mission behind ${SITE.name}.`, url: '/about' },
}

const VALUES = [
  { icon: ShieldCheck, title: 'Trust first', body: 'Real listings from real owners. Verification and moderation are core to the product, not an afterthought.' },
  { icon: Sparkles, title: 'Modern by default', body: 'Fast search, honest photos, clear pricing in LKR, and a clean experience on any device.' },
  { icon: MapPin, title: 'Built for Sri Lanka', body: 'Districts, perches, and the way property is actually bought and sold here — not a foreign template.' },
  { icon: Building2, title: 'Free to start', body: 'Posting a listing costs nothing. Sellers pay only for optional visibility boosts.' },
]

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About us"
      title={`A better way to find property in Sri Lanka`}
      intro={`${SITE.name} is a modern marketplace for land, houses, apartments and commercial property across all 25 districts. We connect buyers and sellers directly — with transparent pricing, direct contact, and tools that make the search genuinely easier.`}
    >
      <Section title="What we're building">
        <p>
          Searching for property in Sri Lanka still means scattered classifieds, outdated photos, and phone numbers
          that ring out. We're replacing that with one trustworthy place: every listing has structured details,
          honest imagery, a direct line to the seller, and — soon — interactive maps and intelligent search that
          understands what you're actually looking for.
        </p>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><v.icon className="size-5" /></span>
            <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
          </div>
        ))}
      </div>

      <Section title="Where we are today">
        <p>
          The platform is young and growing. Buying, selling, saved searches and seller analytics are live; map-based
          discovery and smarter search are rolling out next. If something feels rough, tell us — early feedback shapes
          what we build.
        </p>
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href="/properties">Browse properties</Link></Button>
        <Button asChild variant="outline"><Link href="/contact">Get in touch</Link></Button>
      </div>
    </PageShell>
  )
}
