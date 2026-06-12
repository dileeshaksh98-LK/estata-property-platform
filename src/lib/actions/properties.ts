'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { propertyEditInput, propertyInput, propertyUpdateInput, statusEnum, type PropertyEditInput, type PropertyInput, type PropertyUpdateInput } from '@/lib/validation/property'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

/** Create a listing + its image rows. Returns the new slug on success. */
export async function createProperty(raw: PropertyInput): Promise<ActionResult<{ slug: string }>> {
  const parsed = propertyInput.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const input = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in to post a listing.' }

  const slug = slugify(input.title)
  const { images, contact_phone, contact_whatsapp, ...fields } = input

  // Save contact details to the seller profile so Call/WhatsApp work on the listing.
  if (contact_phone || contact_whatsapp) {
    await supabase.from('profiles').update({
      ...(contact_phone ? { phone: contact_phone } : {}),
      ...(contact_whatsapp ? { whatsapp: contact_whatsapp } : {}),
    }).eq('id', user.id)
  }

  const { data: property, error: insertError } = await supabase
    .from('properties')
    .insert({
      owner_id: user.id,
      slug,
      title: fields.title,
      description: fields.description || null,
      property_type: fields.property_type,
      listing_type: fields.listing_type,
      status: fields.status,
      price: fields.price,
      price_per_unit: fields.price_per_unit ?? false,
      negotiable: fields.negotiable ?? false,
      amenities: fields.amenities ?? [],
      district: fields.district,
      city: fields.city || null,
      address: fields.address || null,
      province: fields.province || null,
      latitude: fields.latitude ?? null,
      longitude: fields.longitude ?? null,
      land_size: fields.land_size ?? null,
      land_size_unit: fields.land_size_unit ?? 'perch',
      building_sqft: fields.building_sqft ?? null,
      bedrooms: fields.bedrooms ?? null,
      bathrooms: fields.bathrooms ?? null,
      parking: fields.parking ?? null,
      year_built: fields.year_built ?? null,
      published_at: fields.status === 'active' ? new Date().toISOString() : null,
    })
    .select('id, slug')
    .single()

  if (insertError || !property) {
    return { ok: false, error: insertError?.message ?? 'Could not create the listing.' }
  }

  const imageRows = images.map((img, i) => ({
    property_id: property.id,
    url: img.url,
    storage_path: img.storage_path ?? null,
    is_primary: img.is_primary ?? i === 0,
    sort_order: img.sort_order ?? i,
  }))
  const { error: imgError } = await supabase.from('property_images').insert(imageRows)
  if (imgError) {
    // Roll back the orphaned property so we don't leave a listing with no photos.
    await supabase.from('properties').delete().eq('id', property.id)
    return { ok: false, error: `Failed to attach images: ${imgError.message}` }
  }

  revalidatePath('/properties')
  revalidatePath('/dashboard')
  return { ok: true, data: { slug: property.slug } }
}

/** Update core fields of a listing the user owns (RLS enforces ownership too). */
export async function updateProperty(raw: PropertyUpdateInput): Promise<ActionResult> {
  const parsed = propertyUpdateInput.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid input', fieldErrors: parsed.error.flatten().fieldErrors }
  const { id, images: _images, contact_phone: _cp, contact_whatsapp: _cw, ...fields } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { error } = await supabase.from('properties').update(fields).eq('id', id).eq('owner_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/properties')
  return { ok: true }
}

/** Delete a listing and its storage objects. Ownership double-checked. */
export async function deleteProperty(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // Verify ownership and collect storage paths before deleting.
  const { data: prop } = await supabase
    .from('properties')
    .select('id, owner_id, property_images(storage_path)')
    .eq('id', id)
    .single()

  if (!prop || prop.owner_id !== user.id) return { ok: false, error: 'Listing not found or not yours.' }

  const paths = (prop.property_images ?? [])
    .map((i) => i.storage_path)
    .filter((p): p is string => !!p)
  if (paths.length) await supabase.storage.from('property-images').remove(paths)

  const { error } = await supabase.from('properties').delete().eq('id', id).eq('owner_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/properties')
  return { ok: true }
}

/** Fire-and-forget view counter (atomic, via security-definer RPC). */
export async function incrementView(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_view_count', { p_id: id })
}

export async function createPropertyAndRedirect(raw: PropertyInput) {
  const result = await createProperty(raw)
  if (result.ok && result.data) redirect(`/properties/${result.data.slug}`)
  return result
}


/** Quick status change from the dashboard (active / sold / rented / draft). */
export async function setListingStatus(id: string, status: string): Promise<ActionResult> {
  const parsed = statusEnum.safeParse(status)
  if (!parsed.success) return { ok: false, error: 'Invalid status.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('properties')
    .update({ status: parsed.data, ...(parsed.data === 'active' ? { published_at: new Date().toISOString() } : {}) })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/properties')
  return { ok: true }
}

/** Full edit: field updates + image add/remove/reorder, with storage cleanup. */
export async function editProperty(raw: PropertyEditInput): Promise<ActionResult<{ slug: string }>> {
  const parsed = propertyEditInput.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const { id, images, contact_phone, contact_whatsapp, ...fields } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (contact_phone || contact_whatsapp) {
    await supabase.from('profiles').update({
      ...(contact_phone ? { phone: contact_phone } : {}),
      ...(contact_whatsapp ? { whatsapp: contact_whatsapp } : {}),
    }).eq('id', user.id)
  }

  // Load current listing (ownership + current images for the diff).
  const { data: current } = await supabase
    .from('properties')
    .select('id, owner_id, slug, property_images(id, storage_path)')
    .eq('id', id)
    .single()
  if (!current || current.owner_id !== user.id) return { ok: false, error: 'Listing not found or not yours.' }

  const { error: updateError } = await supabase
    .from('properties')
    .update({
      title: fields.title,
      description: fields.description || null,
      property_type: fields.property_type,
      listing_type: fields.listing_type,
      price: fields.price,
      negotiable: fields.negotiable ?? false,
      amenities: fields.amenities ?? [],
      district: fields.district,
      city: fields.city || null,
      address: fields.address || null,
      latitude: fields.latitude ?? null,
      longitude: fields.longitude ?? null,
      land_size: fields.land_size ?? null,
      bedrooms: fields.bedrooms ?? null,
      bathrooms: fields.bathrooms ?? null,
      parking: fields.parking ?? null,
      year_built: fields.year_built ?? null,
      status: fields.status,
    })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (updateError) return { ok: false, error: updateError.message }

  // Image diff: delete removed, insert added, refresh order/cover on kept.
  const keptIds = new Set(images.filter((i) => i.id).map((i) => i.id as string))
  const removed = (current.property_images ?? []).filter((i) => !keptIds.has(i.id))

  if (removed.length) {
    const paths = removed.map((r) => r.storage_path).filter((p): p is string => !!p)
    if (paths.length) await supabase.storage.from('property-images').remove(paths)
    await supabase.from('property_images').delete().in('id', removed.map((r) => r.id))
  }

  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    if (img.id) {
      await supabase.from('property_images')
        .update({ is_primary: i === 0, sort_order: i })
        .eq('id', img.id).eq('property_id', id)
    } else {
      await supabase.from('property_images').insert({
        property_id: id, url: img.url, storage_path: img.storage_path ?? null,
        is_primary: i === 0, sort_order: i,
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/properties')
  revalidatePath(`/properties/${current.slug}`)
  return { ok: true, data: { slug: current.slug } }
}
