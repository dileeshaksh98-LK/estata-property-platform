import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inquiryInput } from '@/lib/validation/inquiry'

/**
 * REST endpoint mirroring the sendInquiry server action. Useful for external
 * integrations. Validates with zod, honours the honeypot, and writes via RLS.
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = inquiryInput.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  // Honeypot → pretend success.
  if (parsed.data.company && parsed.data.company.length > 0) return NextResponse.json({ ok: true })

  const { company: _hp, ...payload } = parsed.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('property_inquiries').insert({
    property_id: payload.property_id,
    sender_id: user?.id ?? null,
    name: payload.name,
    email: payload.email || null,
    phone: payload.phone || null,
    message: payload.message,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
