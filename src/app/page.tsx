import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/common/reveal'
import { SearchBar } from '@/components/filters/search-bar'
import { PropertyCard } from '@/components/property/property-card'
import { getFeatured, listProperties } from '@/lib/db/properties.repo'
import { PROPERTY_TYPES, TRENDING_LOCATIONS } from '@/lib/constants'

export const revalidate = 60

const STATS = [
  { value: '12,400+', label: 'Active listings' },
  { value: '8,900+', label: 'Verified sellers' },
  { value: '25', label: 'Districts covered' },
  { value: 'LKR 48B', label: 'Property listed' },
]

const WHY = [
  { title: 'Every property on a live map', body: 'Browse with prices shown right on the pins, and see results update as you move the map.' },
  { title: 'Know the neighbourhood', body: 'Each pinned listing shows the nearest schools, hospitals, supermarkets and transport — automatically, with real distances.' },
  { title: 'Direct & free', body: 'Post your property free and talk to buyers directly by call or WhatsApp. No brokers, no commission.' },
]

export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    getFeatured(3),
    listProperties({ sort: 'newest' }),
  ])

  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <section className="grain relative overflow-hidden">
        <div className="mesh absolute inset-0 -z-10" />
        <div className="container relative pb-16 pt-14 md:pb-24 md:pt-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5 text-accent" /> AI-powered property search, now in Sri Lanka
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 max-w-3xl font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-balance md:text-7xl">
              Find a place that<br className="hidden sm:block" /> feels like <em className="not-italic text-primary">home</em>.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 max-w-xl text-base text-muted-foreground text-pretty md:text-lg">
              Buy, sell and rent land, houses and apartments across all 25 districts - on a live map that shows nearby schools, hospitals and transport for every listing.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 max-w-3xl">
              <SearchBar variant="hero" />
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4 text-primary" /> Verified sellers</span>
              <span className="inline-flex items-center gap-1.5"><TrendingUp className="size-4 text-primary" /> Live market data</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-accent" /> Free to list</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────── CATEGORIES ─────────────── */}
      <section className="container">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PROPERTY_TYPES.map((t, i) => (
            <Reveal key={t.value} delay={i * 0.06}>
              <Link
                href={`/properties?type=${t.value}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <t.icon className="size-6" />
                </span>
                <div>
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">Browse all</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────── FEATURED ─────────────── */}
      <section className="container mt-20">
        <SectionHeading
          eyebrow="Hand-picked"
          title="Featured properties"
          href="/properties"
          linkLabel="View all"
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <PropertyCard property={p} priority={i < 3} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────── TRENDING LOCATIONS ─────────────── */}
      <section className="container mt-20">
        <SectionHeading eyebrow="Where people are buying" title="Trending locations" />
        <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {TRENDING_LOCATIONS.map((loc, i) => (
            <Reveal key={loc.name} delay={i * 0.05}>
              <Link
                href={`/properties?q=${encodeURIComponent(loc.name)}`}
                className="group relative block h-44 w-64 shrink-0 overflow-hidden rounded-3xl md:w-auto"
              >
                <Image src={loc.img} alt={loc.name} fill sizes="(max-width:768px) 256px, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <p className="font-display text-xl font-semibold">{loc.name}</p>
                  <p className="text-sm text-white/80">{loc.count} listings · {loc.district}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────── STATS ─────────────── */}
      <section className="container mt-20">
        <Reveal>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-card p-8 text-center">
                <p className="font-display text-3xl font-semibold text-primary md:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─────────────── AI ASSISTANT CTA ─────────────── */}
      <section className="container mt-20">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-4xl bg-primary p-8 text-primary-foreground md:p-14">
            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5" /> Estata AI
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight md:text-4xl">
                Describe your dream home. Let AI find it.
              </h2>
              <p className="mt-3 text-primary-foreground/80 text-pretty">
                “10 perch land near Colombo under 15 million.” “Family house close to international schools.” Just ask — in English, Sinhala or Tamil.
              </p>
              <Button asChild variant="accent" size="lg" className="mt-7">
                <Link href="/properties">Try AI search <ArrowRight className="-mr-1" /></Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─────────────── LATEST ─────────────── */}
      <section className="container mt-20">
        <SectionHeading eyebrow="Fresh on the market" title="Latest listings" href="/properties?sort=newest" linkLabel="See more" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.listings.slice(0, 6).map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.08}>
              <PropertyCard property={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────── WHY ESTATA ─────────────── */}
      <section className="container mt-20">
        <SectionHeading eyebrow="Why Estata" title="A clearer way to find property" />
        <div className="grid gap-5 md:grid-cols-3">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft">
                <h3 className="font-display text-lg font-semibold">{w.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-muted-foreground text-pretty">{w.body}</p>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}

function SectionHeading({
  eyebrow, title, href, linkLabel,
}: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
          {linkLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
