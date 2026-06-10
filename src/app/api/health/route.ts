import { NextResponse } from 'next/server'

/** Lightweight deployment check: confirms the app runs and env wiring exists. */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  })
}
