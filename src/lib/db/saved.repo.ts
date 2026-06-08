import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/types/property'

/** Saved listings for the signed-in user (used for SSR of /saved). */
export async function getSavedProperties(): Promise<Property[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('saved_properties')
    .select('properties(*, property_images(id, url, is_primary, sort_order))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getSavedProperties: ${error.message}`)
  return (data ?? [])
    .map((r) => (Array.isArray(r.properties) ? r.properties[0] : r.properties))
    .filter(Boolean) as unknown as Property[]
}
