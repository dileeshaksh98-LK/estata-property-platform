import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ConversationSummary, Message } from '@/types/property'

/** Inbox: all conversations for the current user (as buyer or seller). */
export async function getInbox(): Promise<ConversationSummary[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: convs } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })
  if (!convs || convs.length === 0) return []

  const propIds = [...new Set(convs.map((c) => c.property_id))]
  const otherIds = [...new Set(convs.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id)))]
  const convIds = convs.map((c) => c.id)

  const [{ data: props }, { data: people }, { data: msgs }] = await Promise.all([
    supabase.from('properties').select('id, slug, title, price, property_images(url, is_primary)').in('id', propIds),
    supabase.from('profiles').select('id, full_name').in('id', otherIds),
    supabase.from('messages').select('conversation_id, body, created_at, sender_id, read_at').in('conversation_id', convIds).order('created_at', { ascending: false }),
  ])

  const propMap = new Map((props ?? []).map((p) => {
    const cover = (p.property_images ?? []).find((i: { is_primary: boolean }) => i.is_primary)?.url
      ?? (p.property_images ?? [])[0]?.url ?? null
    return [p.id, { id: p.id, slug: p.slug, title: p.title, price: Number(p.price), cover_url: cover }]
  }))
  const peopleMap = new Map((people ?? []).map((p) => [p.id, p]))

  return convs.map((c) => {
    const cmsgs = (msgs ?? []).filter((m) => m.conversation_id === c.id)
    const last = cmsgs[0] ?? null
    const unread = cmsgs.filter((m) => m.sender_id !== user.id && !m.read_at).length
    const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id
    return {
      ...c,
      property: propMap.get(c.property_id) ?? null,
      other: peopleMap.get(otherId) ?? null,
      last_message: last ? { body: last.body, created_at: last.created_at, sender_id: last.sender_id } : null,
      unread,
    }
  })
}

export async function getConversation(id: string): Promise<{
  conversation: ConversationSummary | null
  messages: Message[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { conversation: null, messages: [] }

  const { data: c } = await supabase.from('conversations').select('*').eq('id', id).maybeSingle()
  if (!c || (c.buyer_id !== user.id && c.seller_id !== user.id)) return { conversation: null, messages: [] }

  const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id
  const [{ data: prop }, { data: other }, { data: messages }] = await Promise.all([
    supabase.from('properties').select('id, slug, title, price, property_images(url, is_primary)').eq('id', c.property_id).maybeSingle(),
    supabase.from('profiles').select('id, full_name').eq('id', otherId).maybeSingle(),
    supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
  ])

  const cover = prop ? ((prop.property_images ?? []).find((i: { is_primary: boolean }) => i.is_primary)?.url ?? (prop.property_images ?? [])[0]?.url ?? null) : null
  const summary: ConversationSummary = {
    ...c,
    property: prop ? { id: prop.id, slug: prop.slug, title: prop.title, price: Number(prop.price), cover_url: cover } : null,
    other: other ?? null,
    last_message: null,
    unread: 0,
  }
  return { conversation: summary, messages: (messages ?? []) as Message[] }
}

/** Count of unread messages across all conversations (for the navbar badge). */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const { data: convs } = await supabase
    .from('conversations').select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
  if (!convs || convs.length === 0) return 0
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convs.map((c) => c.id))
    .neq('sender_id', user.id)
    .is('read_at', null)
  return count ?? 0
}
