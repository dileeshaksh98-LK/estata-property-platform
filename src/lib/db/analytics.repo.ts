import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SellerStats } from '@/lib/types/database'

const ZERO: SellerStats = { total_views: 0, total_saved: 0, total_leads: 0, active_listings: 0 }

/**
 * Aggregated dashboard stats. Uses a security-definer RPC (get_seller_stats)
 * so saved/lead counts across the owner's listings are accurate without
 * loosening RLS. See supabase-setup.sql.
 */
export async function getSellerStats(): Promise<SellerStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ZERO
  const { data, error } = await supabase.rpc('get_seller_stats')
  if (error || !data?.length) return ZERO
  return data[0]
}
