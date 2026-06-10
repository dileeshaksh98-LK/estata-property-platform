import { PropertyCard } from './property-card'
import { EmptyState } from '@/components/common/empty-state'
import type { Property } from '@/types/property'

export function PropertyGrid({ properties, columns }: { properties: Property[]; columns?: 1 }) {
  if (!properties.length) {
    return (
      <EmptyState
        title="No properties match your search"
        description="Try widening your price range, choosing a nearby district, or clearing some filters."
        action={{ label: 'Clear filters', href: '/properties' }}
      />
    )
  }
  return (
    <div className={columns === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'}>
      {properties.map((p, i) => (
        <PropertyCard key={p.id} property={p} priority={i < 3} />
      ))}
    </div>
  )
}
