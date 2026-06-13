import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { PropertyType, ListingType } from '@/types/property'

export interface AreaStats {
  count: number
  minPrice: number | null
  maxPrice: number | null
  medianPrice: number | null
}

/**
 * Price snapshot for one district × property-type × listing-type, computed from
 * live active inventory. Powers the "price from / median" box that AI engines
 * and searchers quote, and the thin-content gate (we noindex pages with < MIN).
 */
export async function getAreaStats(
  district: string,
  propertyType: PropertyType,
  listingType: ListingType,
): Promise<AreaStats> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('price')
    .eq('status', 'active')
    .eq('district', district)
    .eq('property_type', propertyType)
    .eq('listing_type', listingType)
    .order('price', { ascending: true })

  if (error || !data || data.length === 0) {
    return { count: 0, minPrice: null, maxPrice: null, medianPrice: null }
  }
  const prices = data.map((r) => Number(r.price)).filter((n) => Number.isFinite(n))
  if (prices.length === 0) return { count: 0, minPrice: null, maxPrice: null, medianPrice: null }
  const mid = Math.floor(prices.length / 2)
  const median = prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2)
  return { count: prices.length, minPrice: prices[0], maxPrice: prices[prices.length - 1], medianPrice: median }
}

/**
 * Active counts grouped by district+type+listing — one round-trip used to decide
 * which programmatic pages are indexable (>= MIN_INDEXABLE listings) for the
 * sitemap. Returns a Set of "district|propertyType|listingType" keys.
 */
export async function getIndexableComboKeys(minListings: number): Promise<Set<string>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('district, property_type, listing_type')
    .eq('status', 'active')

  const keys = new Set<string>()
  if (error || !data) return keys
  const counts = new Map<string, number>()
  for (const r of data) {
    if (!r.district) continue
    const k = `${r.district}|${r.property_type}|${r.listing_type}`
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  for (const [k, n] of counts) if (n >= minListings) keys.add(k)
  return keys
}

/** Minimum active listings before a programmatic page is indexable. */
export const MIN_INDEXABLE = 3
