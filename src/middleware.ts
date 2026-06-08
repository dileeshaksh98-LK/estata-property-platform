import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // If Supabase isn't configured yet, do nothing (keeps local dev unblocked).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next()
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image optimisation, so the
     * session cookie is refreshed across the whole app.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
