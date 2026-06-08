'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileInput, type ProfileInput } from '@/lib/validation/profile'

export type ProfileResult = { ok: true } | { ok: false; error: string }

export async function updateProfile(raw: ProfileInput): Promise<ProfileResult> {
  const parsed = profileInput.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid profile details.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      bio: parsed.data.bio || null,
    })
    .eq('id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}
