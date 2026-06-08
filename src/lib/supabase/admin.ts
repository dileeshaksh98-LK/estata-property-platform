import { createClient as createAdminBase } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Privileged client that bypasses RLS. Use ONLY in trusted server code
 * (server actions / route handlers) for operations the user legitimately
 * triggers but that RLS can't express (e.g. atomic counter bumps).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createAdminBase<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
