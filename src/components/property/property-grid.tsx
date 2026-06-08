import { PropertyCard } from './property-card'
import { EmptyState } from '@/components/common/empty-state'
import type { Property } from '@/types/property'

export function PropertyGrid({ properties }: { properties: Property[] }) {
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p, i) => (
        <PropertyCard key={p.id} property={p} priority={i < 3} />
      ))}
    </div>
  )
}
