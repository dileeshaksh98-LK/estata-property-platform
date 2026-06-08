import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string
  created_at: string
  property: { id: string; title: string; slug: string } | null
}

/** Leads across the signed-in owner's listings (RLS: owner-only select). */
export async function getOwnerInquiries(limit = 50): Promise<Lead[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('property_inquiries')
    .select('id, name, email, phone, message, created_at, properties!inner(id, title, slug, owner_id)')
    .eq('properties.owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`getOwnerInquiries: ${error.message}`)

  return (data ?? []).map((row) => {
    const prop = Array.isArray(row.properties) ? row.properties[0] : row.properties
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      created_at: row.created_at,
      property: prop ? { id: prop.id, title: prop.title, slug: prop.slug } : null,
    }
  })
}
