import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

export const supabaseEnabled =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/** Singleton browser client so we don't recreate it on every render. */
export function createClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return browserClient
}
