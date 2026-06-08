'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inquiryInput, type InquiryInput } from '@/lib/validation/inquiry'

export type InquiryResult = { ok: true } | { ok: false; error: string }

/**
 * Records a contact-seller lead. Anti-spam: zod validation + honeypot field +
 * minimum dwell handled client-side. contact_count is bumped via a
 * security-definer RPC (service role) since the inquirer isn't the owner.
 */
export async function sendInquiry(raw: InquiryInput): Promise<InquiryResult> {
  const parsed = inquiryInput.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Please complete the form correctly.' }
  // Honeypot tripped → silently succeed so bots don't learn anything.
  if (parsed.data.company && parsed.data.company.length > 0) return { ok: true }

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
  if (error) return { ok: false, error: error.message }

  // Best-effort counter bump (don't fail the lead if the service key is absent).
  try {
    const admin = createAdminClient()
    await admin.rpc('increment_contact_count', { p_id: payload.property_id })
  } catch {
    /* service role not configured in this environment — skip */
  }

  return { ok: true }
}
