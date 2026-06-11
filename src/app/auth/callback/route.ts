import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeInternalPath } from '@/lib/auth/safe-redirect'

/**
 * OAuth / magic-link / email-confirm callback. Supabase redirects here with a
 * `code` which we exchange for a session, then forward the user on.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeInternalPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocal = process.env.NODE_ENV === 'development'
      if (isLocal) return NextResponse.redirect(`${origin}${next}`)
      if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${next}`)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
