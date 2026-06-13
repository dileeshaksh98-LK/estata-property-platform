'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/properties'

/** Buyer starts (or reopens) a conversation about a property. Returns its id. */
export async function startConversation(propertyId: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in to message the seller.' }
  const { data, error } = await supabase.rpc('get_or_create_conversation', { p_property_id: propertyId })
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not start the conversation.' }
  revalidatePath('/dashboard/messages')
  return { ok: true, data: { id: data } }
}

export async function sendMessage(conversationId: string, body: string): Promise<ActionResult> {
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'Message is empty.' }
  if (trimmed.length > 4000) return { ok: false, error: 'Message is too long.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId, sender_id: user.id, body: trimmed,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Mark all messages in a conversation that the current user received as read. */
export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}
