import type { Metadata } from 'next'
import { FilterSidebar, FilterDrawer, SortSelect } from '@/components/filters/filter-panel'
import { PropertyGrid } from '@/components/property/property-grid'
import { Pagination } from '@/components/common/pagination'
import { listMapMarkers, listProperties } from '@/lib/db/properties.repo'
import Link from 'next/link'
import { BrowseMapLoader } from '@/components/map/browse-map-loader'
import { DISTRICTS } from '@/lib/constants'
import { nearbyDistricts } from '@/lib/districts-nearby'
import { ViewToggle } from '@/components/map/view-toggle'
import type { ListingFilters } from '@/types/property'

export const metadata: Metadata = {
  alternates: { canonical: '/properties' },
  title: 'Browse properties',
  description: 'Search land, houses and apartments for sale and rent across Sri Lanka on a live map.',
}

type SP = Record<string, string | string[] | undefined>

function parse(sp: SP): ListingFilters {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined)
  const num = (k: string) => { const v = one(k); return v ? Number(v) : undefined }
  return {
    type: one('type') as ListingFilters['type'],
    listing: one('listing') as ListingFilters['listing'],
    district: one('district'),
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    beds: num('beds'),
    q: one('q'),
    sort: (one('sort') as ListingFilters['sort']) ?? 'newest',
    page: num('page') ?? 1,
    bbox: one('bbox'),
    view: one('view') === 'map' ? 'map' : 'list',
    near: one('near'),
    radius: num('radius'),
    loc: one('loc'),
  }
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const filters = parse(sp)

  // Smart ranking: a query that IS a district name becomes a district filter.
  if (filters.q && !filters.district) {
    const match = DISTRICTS.find((d) => d.toLowerCase() === filters.q!.trim().toLowerCase())
    if (match) { filters.district = match; filters.q = undefined }
  }
  const mapMode = filters.view === 'map'
  const [{ listings, total, page, pageSize }, markers] = await Promise.all([
    listProperties(filters),
    mapMode ? listMapMarkers(filters) : Promise.resolve([]),
  ])

  const makeHref = (p: number) => {
    const next = new URLSearchParams()
    Object.entries(sp).forEach(([k, v]) => { if (typeof v === 'string' && k !== 'page') next.set(k, v) })
    next.set('page', String(p))
    return `/properties?${next.toString()}`
  }

  return (
    <div className="container pt-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {filters.near && filters.loc ? `Properties near ${filters.loc}`
            : filters.q ? `Results for “${filters.q}”`
            : filters.district ? `Properties in ${filters.district}`
            : 'Properties in Sri Lanka'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {total.toLocaleString()} {total === 1 ? 'property' : 'properties'} available
          {filters.near ? ` within ${filters.radius ?? 5} km` : ''}
        </p>
        {filters.near && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Search radius">
            <span className="text-sm text-muted-foreground">Radius:</span>
            {[2, 5, 10, 25].map((km) => {
              const next = new URLSearchParams()
              Object.entries(sp).forEach(([k, v]) => { if (typeof v === 'string' && k !== 'page' && k !== 'radius') next.set(k, v) })
              next.set('radius', String(km))
              const active = (filters.radius ?? 5) === km
              return (
                <Link key={km} href={`/properties?${next.toString()}`}
                  className={active
                    ? 'rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground'
                    : 'rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold hover:bg-secondary'}>
                  {km} km
                </Link>
              )
            })}
          </div>
        )}
      </header>

      <div className="flex gap-8">
        {!mapMode && <FilterSidebar />}

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FilterDrawer />
              <ViewToggle />
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
              <SortSelect />
            </div>
          </div>

          {mapMode ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,440px)_1fr]">
              {/* list column hidden on mobile (map fills the screen there) */}
              <div className="hidden max-h-[calc(100dvh-14rem)] space-y-4 overflow-y-auto pr-1 lg:block">
                <PropertyGrid properties={listings} columns={1} />
                <Pagination page={page} total={total} pageSize={pageSize} makeHref={makeHref} />
              </div>
              <div className="sticky top-20 h-[calc(100dvh-9rem)] min-h-[420px] lg:h-[calc(100dvh-12rem)]">
                <BrowseMapLoader markers={markers} />
              </div>
            </div>
          ) : (
            <>
              <PropertyGrid properties={listings} />
              {listings.length === 0 && nearbyDistricts(filters.district).length > 0 && (
                <div className="mt-6 rounded-3xl border border-border bg-card p-5 text-center">
                  <p className="text-sm font-medium">Try a nearby district</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {nearbyDistricts(filters.district).map((d) => {
                      const next = new URLSearchParams()
                      Object.entries(sp).forEach(([k, v]) => { if (typeof v === 'string' && !['page', 'district', 'q', 'near', 'radius', 'loc'].includes(k)) next.set(k, v) })
                      next.set('district', d)
                      return (
                        <Link key={d} href={`/properties?${next.toString()}`} className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-semibold hover:bg-secondary">
                          {d}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
              <Pagination page={page} total={total} pageSize={pageSize} makeHref={makeHref} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
