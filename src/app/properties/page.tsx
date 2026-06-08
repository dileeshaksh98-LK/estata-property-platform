import type { Metadata } from 'next'
import { FilterSidebar, FilterDrawer, SortSelect } from '@/components/filters/filter-panel'
import { PropertyGrid } from '@/components/property/property-grid'
import { Pagination } from '@/components/common/pagination'
import { listProperties } from '@/lib/db/properties.repo'
import type { ListingFilters } from '@/types/property'

export const metadata: Metadata = {
  title: 'Browse properties',
  description: 'Search verified land, houses and apartments for sale and rent across Sri Lanka.',
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
  }
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const filters = parse(sp)
  const { listings, total, page, pageSize } = await listProperties(filters)

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
          {filters.q ? `Results for “${filters.q}”` : 'Properties in Sri Lanka'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {total.toLocaleString()} {total === 1 ? 'property' : 'properties'} available
        </p>
      </header>

      <div className="flex gap-8">
        <FilterSidebar />

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <FilterDrawer />
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
              <SortSelect />
            </div>
          </div>

          <PropertyGrid properties={listings} />

          <Pagination page={page} total={total} pageSize={pageSize} makeHref={makeHref} />
        </div>
      </div>
    </div>
  )
}
