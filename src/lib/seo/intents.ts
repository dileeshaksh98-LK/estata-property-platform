import type { ListingType, PropertyType } from '@/types/property'

/**
 * Programmatic SEO "intents": each maps a URL slug segment (e.g. "land-for-sale")
 * to the underlying property + listing filters, plus the human labels used in
 * titles, H1s, and breadcrumbs. The district×intent matrix generates one
 * indexable landing page per combination once it has enough live inventory.
 */
export interface SeoIntent {
  slug: string
  propertyType: PropertyType
  listingType: ListingType
  /** Plural noun for headings, e.g. "Land", "Houses for rent". */
  label: string
  /** Used in <title>: "{titleNoun} in {District}". */
  titleNoun: string
  /** Verb phrase for prose: "for sale", "for rent". */
  forPhrase: string
}

export const SEO_INTENTS: SeoIntent[] = [
  { slug: 'land-for-sale', propertyType: 'land', listingType: 'sale', label: 'Land', titleNoun: 'Land for sale', forPhrase: 'for sale' },
  { slug: 'houses-for-sale', propertyType: 'house', listingType: 'sale', label: 'Houses', titleNoun: 'Houses for sale', forPhrase: 'for sale' },
  { slug: 'houses-for-rent', propertyType: 'house', listingType: 'rent', label: 'Houses for rent', titleNoun: 'Houses for rent', forPhrase: 'for rent' },
  { slug: 'apartments-for-sale', propertyType: 'apartment', listingType: 'sale', label: 'Apartments', titleNoun: 'Apartments for sale', forPhrase: 'for sale' },
  { slug: 'apartments-for-rent', propertyType: 'apartment', listingType: 'rent', label: 'Apartments for rent', titleNoun: 'Apartments for rent', forPhrase: 'for rent' },
  { slug: 'commercial-property', propertyType: 'commercial', listingType: 'sale', label: 'Commercial property', titleNoun: 'Commercial property', forPhrase: 'for sale' },
]

export const SEO_INTENT_BY_SLUG: Record<string, SeoIntent> = Object.fromEntries(
  SEO_INTENTS.map((i) => [i.slug, i]),
)

/** District slug helpers: "Nuwara Eliya" <-> "nuwara-eliya". */
export function districtToSlug(district: string): string {
  return district.toLowerCase().replace(/\s+/g, '-')
}

export function slugToDistrict(slug: string, districts: readonly string[]): string | null {
  const norm = slug.toLowerCase()
  return districts.find((d) => districtToSlug(d) === norm) ?? null
}
