import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PropertyGrid } from '@/components/property/property-grid'
import { Pagination } from '@/components/common/pagination'
import { listProperties } from '@/lib/db/properties.repo'
import { getAreaStats, MIN_INDEXABLE } from '@/lib/db/seo.repo'
import { SEO_INTENTS, SEO_INTENT_BY_SLUG, districtToSlug, slugToDistrict } from '@/lib/seo/intents'
import { DISTRICTS, SITE } from '@/lib/constants'
import { nearbyDistricts } from '@/lib/districts-nearby'
import { formatPriceFull } from '@/lib/format'

export const dynamic = 'force-dynamic'

type Params = Promise<{ district: string; intent: string }>
type SP = Promise<Record<string, string | string[] | undefined>>

function resolve(districtSlug: string, intentSlug: string) {
  const intent = SEO_INTENT_BY_SLUG[intentSlug]
  const district = slugToDistrict(districtSlug, DISTRICTS)
  if (!intent || !district) return null
  return { intent, district }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { district: ds, intent: is } = await params
  const r = resolve(ds, is)
  if (!r) return {}
  const { intent, district } = r
  const stats = await getAreaStats(district, intent.propertyType, intent.listingType)
  const path = `/${districtToSlug(district)}/${intent.slug}`
  const year = new Date().getFullYear()

  const title = stats.minPrice
    ? `${intent.titleNoun} in ${district} ${year} — from ${formatPriceFull(stats.minPrice)} | Estata`
    : `${intent.titleNoun} in ${district} ${year} | Estata`
  const description = `Browse ${stats.count > 0 ? stats.count + ' ' : ''}${intent.label.toLowerCase()} ${intent.forPhrase} in ${district}, Sri Lanka. Live map, prices on every pin, and nearby schools, hospitals & transport shown automatically. Post free on Estata.`

  // Gate indexing on inventory depth — thin pages stay out of the index.
  const indexable = stats.count >= MIN_INDEXABLE
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `${SITE.url}${path}`, type: 'website' },
  }
}

export default async function AreaIntentPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { district: ds, intent: is } = await params
  const sp = await searchParams
  const r = resolve(ds, is)
  if (!r) notFound()
  const { intent, district } = r

  const page = typeof sp.page === 'string' ? Math.max(1, Number(sp.page) || 1) : 1
  const [{ listings, total, pageSize }, stats] = await Promise.all([
    listProperties({ district, type: intent.propertyType, listing: intent.listingType, page, sort: 'newest' }),
    getAreaStats(district, intent.propertyType, intent.listingType),
  ])

  const year = new Date().getFullYear()
  const h1 = `${intent.titleNoun} in ${district}`
  const nearby = nearbyDistricts(district, 4)

  // FAQs — answer-shaped for AI engines; data-driven where stats exist.
  const faqs: { q: string; a: string }[] = []
  if (stats.minPrice && stats.medianPrice) {
    faqs.push({
      q: `How much does ${intent.label.toLowerCase()} ${intent.forPhrase} cost in ${district}?`,
      a: `${intent.label} ${intent.forPhrase} in ${district} currently starts from ${formatPriceFull(stats.minPrice)}, with a median asking price of ${formatPriceFull(stats.medianPrice)} based on ${stats.count} active listing${stats.count === 1 ? '' : 's'} on Estata as of ${year}.`,
    })
  }
  faqs.push({
    q: `How do I contact the seller of a ${intent.label.toLowerCase().replace(/s$/, '')} in ${district}?`,
    a: `Every listing on Estata shows the seller's contact details. You can call or message them directly via WhatsApp from the listing page — there are no brokers and no commission.`,
  })
  faqs.push({
    q: `Does Estata show nearby schools and amenities for ${district} properties?`,
    a: `Yes. Every pinned listing in ${district} automatically displays the nearest schools, hospitals, supermarkets and public transport with real distances, so you can judge the neighbourhood before visiting.`,
  })
  faqs.push({
    q: `Is it free to post ${intent.label.toLowerCase()} ${intent.forPhrase} in ${district}?`,
    a: `Yes, posting a property on Estata is completely free. Create an account, add photos, drop a pin on the map, and your listing can be live in a few minutes.`,
  })

  const path = `/${districtToSlug(district)}/${intent.slug}`
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: 'Properties', item: `${SITE.url}/properties` },
      { '@type': 'ListItem', position: 3, name: h1, item: `${SITE.url}${path}` },
    ],
  }
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: listings.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/properties/${p.slug}`,
    })),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {listings.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}

      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/properties" className="hover:text-foreground">Properties</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{h1}</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{h1}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse {total > 0 ? `${total} ` : ''}{intent.label.toLowerCase()} {intent.forPhrase} in {district}, Sri Lanka.
          Every listing shows prices on a live map, with nearby schools, hospitals and transport detected automatically.
        </p>
      </header>

      {/* Price snapshot — data-driven, quotable */}
      {stats.count > 0 && stats.minPrice && stats.maxPrice && stats.medianPrice && (
        <section className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-secondary/40 p-4 sm:grid-cols-4">
          <Stat label="Listings" value={String(stats.count)} />
          <Stat label="From" value={formatPriceFull(stats.minPrice)} />
          <Stat label="Median" value={formatPriceFull(stats.medianPrice)} />
          <Stat label="Up to" value={formatPriceFull(stats.maxPrice)} />
        </section>
      )}

      {/* Listings */}
      <PropertyGrid properties={listings} />
      <Pagination page={page} total={total} pageSize={pageSize} makeHref={(p) => `${path}?page=${p}`} />

      {/* Nearby districts */}
      {nearby.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Nearby districts</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {nearby.map((d) => (
              <Link
                key={d}
                href={`/${districtToSlug(d)}/${intent.slug}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary"
              >
                {intent.label} in {d}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other property types in this district */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">More in {district}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEO_INTENTS.filter((i) => i.slug !== intent.slug).map((i) => (
            <Link
              key={i.slug}
              href={`/${districtToSlug(district)}/${i.slug}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary"
            >
              {i.titleNoun} in {district}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-2xl font-semibold">Frequently asked questions</h2>
        <dl className="mt-4 divide-y divide-border">
          {faqs.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-3xl border border-border bg-primary/5 p-8 text-center">
        <h2 className="font-display text-2xl font-semibold">Selling {intent.label.toLowerCase()} in {district}?</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Post your property free on Estata. Buyers contact you directly — no brokers, no commission.
        </p>
        <Link
          href="/dashboard/listings/new"
          className="mt-5 inline-flex h-12 items-center rounded-full bg-primary px-8 font-medium text-primary-foreground hover:opacity-90"
        >
          Post your property free
        </Link>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-base font-semibold sm:text-lg">{value}</p>
    </div>
  )
}
