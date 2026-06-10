import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Bath, BedDouble, Calendar, Car, ChevronRight, GraduationCap,
  Hospital, MapPin, Maximize, ShoppingBag, Train, Trees,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ImageGallery } from '@/components/property/image-gallery'
import { PropertyActions } from '@/components/property/property-actions'
import { PropertyCard } from '@/components/property/property-card'
import { Reveal } from '@/components/common/reveal'
import { getPropertyBySlug, getSimilar } from '@/lib/db/properties.repo'
import { ViewTracker } from '@/components/property/view-tracker'
import { formatLandSize } from '@/lib/format'
import { SITE } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await getPropertyBySlug(slug)
  if (!p) return { title: 'Property not found' }
  const cover = p.property_images?.[0]?.url
  return {
    title: p.title,
    alternates: { canonical: `/properties/${p.slug}` },
    description: p.description?.slice(0, 155) ?? SITE.description,
    openGraph: {
      title: p.title,
      description: p.description ?? '',
      images: cover ? [{ url: cover }] : undefined,
      type: 'website',
    },
  }
}

const NEARBY = [
  { icon: GraduationCap, label: 'Schools', detail: 'Royal College · 1.2 km' },
  { icon: Hospital, label: 'Hospital', detail: 'Nawaloka · 2.4 km' },
  { icon: Train, label: 'Transport', detail: 'Railway station · 800 m' },
  { icon: ShoppingBag, label: 'Shopping', detail: 'Arcade Mall · 1.5 km' },
]

export default async function PropertyDetailPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const property = await getPropertyBySlug(slug)
  if (!property) notFound()

  const similar = await getSimilar(property)
  const isRent = property.listing_type === 'rent'

  const facts: { icon: typeof BedDouble; label: string; value: string }[] = []
  if (property.bedrooms) facts.push({ icon: BedDouble, label: 'Bedrooms', value: String(property.bedrooms) })
  if (property.bathrooms) facts.push({ icon: Bath, label: 'Bathrooms', value: String(property.bathrooms) })
  if (property.parking) facts.push({ icon: Car, label: 'Parking', value: String(property.parking) })
  if (property.building_sqft) facts.push({ icon: Maximize, label: 'Floor area', value: `${property.building_sqft.toLocaleString()} ft²` })
  if (property.land_size) facts.push({ icon: Trees, label: 'Land size', value: formatLandSize(property.land_size, property.land_size_unit) ?? '' })
  if (property.year_built) facts.push({ icon: Calendar, label: 'Year built', value: String(property.year_built) })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${SITE.url}/properties/${property.slug}`,
    image: property.property_images?.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency,
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      addressRegion: property.district,
      addressCountry: 'LK',
    },
  }

  return (
    <div className="container pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker id={property.id} />

      {/* breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/properties" className="hover:text-foreground">Properties</Link>
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 text-foreground">{property.title}</span>
      </nav>

      <ImageGallery images={property.property_images} title={property.title} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* main column */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {property.is_featured && <Badge variant="featured">Featured</Badge>}
            <Badge variant={isRent ? 'rent' : 'verified'}>{isRent ? 'For Rent' : 'For Sale'}</Badge>
            <Badge variant="outline" className="capitalize">{property.property_type}</Badge>
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl text-balance">
            {property.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" /> {property.city}{property.district ? `, ${property.district}` : ''}
          </p>

          {/* key facts */}
          {facts.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl border border-border bg-card p-4">
                  <f.icon className="size-5 text-primary" />
                  <p className="mt-2 font-display text-lg font-semibold">{f.value}</p>
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* description */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">About this property</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">{property.description}</p>
          </section>

          {/* map placeholder (OpenStreetMap/Leaflet wires in here at Phase 2) */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Location</h2>
            <div className="mt-3 relative h-64 overflow-hidden rounded-3xl border border-border bg-secondary">
              <div className="grain mesh absolute inset-0" />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-card shadow-soft">
                    <MapPin className="size-6 text-accent" />
                  </span>
                  <p className="mt-3 text-sm font-medium">{property.city}, {property.district}</p>
                  <p className="text-xs text-muted-foreground">Interactive map loads in Phase 2 (Leaflet + OpenStreetMap)</p>
                </div>
              </div>
            </div>
          </section>

          {/* nearby */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">What’s nearby</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {NEARBY.map((n) => (
                <div key={n.label} className="rounded-2xl border border-border bg-card p-4">
                  <n.icon className="size-5 text-primary" />
                  <p className="mt-2 text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* sidebar actions */}
        <aside>
          <PropertyActions property={property} />
        </aside>
      </div>

      {/* similar */}
      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-7 font-display text-3xl font-semibold tracking-tight">Similar properties</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <PropertyCard property={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
