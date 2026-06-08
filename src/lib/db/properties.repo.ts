import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ListingFilters, Property } from '@/types/property'

export const PAGE_SIZE = 9

const LIST_SELECT = '*, property_images(id, url, is_primary, sort_order)'
const DETAIL_SELECT =
  '*, property_images(id, url, storage_path, is_primary, sort_order), profiles(id, full_name, avatar_url, phone, whatsapp, verification_level)'

export interface ListResult {
  listings: Property[]
  total: number
  page: number
  pageSize: number
}

/** Public, filtered, paginated listing query (RLS exposes only active rows). */
export async function listProperties(f: ListingFilters = {}): Promise<ListResult> {
  const supabase = await createClient()
  const page = Math.max(1, f.page ?? 1)
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('properties')
    .select(LIST_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .range(from, from + PAGE_SIZE - 1)

  if (f.sort === 'price_asc') query = query.order('price', { ascending: true })
  else if (f.sort === 'price_desc') query = query.order('price', { ascending: false })
  else query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })

  if (f.type) query = query.eq('property_type', f.type)
  if (f.listing) query = query.eq('listing_type', f.listing)
  if (f.district) query = query.eq('district', f.district)
  if (typeof f.minPrice === 'number') query = query.gte('price', f.minPrice)
  if (typeof f.maxPrice === 'number') query = query.lte('price', f.maxPrice)
  if (typeof f.beds === 'number') query = query.gte('bedrooms', f.beds)
  if (f.q) query = query.textSearch('search_vector', f.q, { type: 'websearch', config: 'simple' })

  const { data, count, error } = await query
  if (error) throw new Error(`listProperties: ${error.message}`)
  return { listings: (data ?? []) as unknown as Property[], total: count ?? 0, page, pageSize: PAGE_SIZE }
}

export async function getFeatured(limit = 3): Promise<Property[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select(LIST_SELECT)
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`getFeatured: ${error.message}`)
  return (data ?? []) as unknown as Property[]
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select(DETAIL_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(`getPropertyBySlug: ${error.message}`)
  return (data as unknown as Property) ?? null
}

export async function getSimilar(p: Property, limit = 3): Promise<Property[]> {
  const supabase = await createClient()
  let query = supabase
    .from('properties')
    .select(LIST_SELECT)
    .eq('status', 'active')
    .eq('property_type', p.property_type)
    .neq('id', p.id)
    .limit(limit)
  if (p.district) query = query.eq('district', p.district)
  const { data, error } = await query
  if (error) throw new Error(`getSimilar: ${error.message}`)
  return (data ?? []) as unknown as Property[]
}

/** Slugs for the sitemap and static params. */
export async function getAllActiveSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('slug')
    .eq('status', 'active')
    .limit(5000)
  if (error) throw new Error(`getAllActiveSlugs: ${error.message}`)
  return (data ?? []).map((r) => r.slug)
}

/** The signed-in seller's own listings (all statuses — RLS allows owner rows). */
export async function getOwnerProperties(): Promise<Property[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('properties')
    .select(LIST_SELECT)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getOwnerProperties: ${error.message}`)
  return (data ?? []) as unknown as Property[]
}
