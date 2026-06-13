'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markConversationRead } from '@/lib/actions/messages'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import type { Message } from '@/types/property'

export function ChatThread({
  conversationId, currentUserId, initialMessages,
}: { conversationId: string; currentUserId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(scrollToEnd, [messages])

  // Mark received messages read on open.
  useEffect(() => { markConversationRead(conversationId) }, [conversationId])

  // Live subscription: append new messages as they arrive.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
          if (m.sender_id !== currentUserId) markConversationRead(conversationId)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  async function submit() {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setBody('')
    // Optimistic append.
    const optimistic: Message = {
      id: `tmp-${Date.now()}`, conversation_id: conversationId, sender_id: currentUserId,
      body: text, read_at: null, created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    const res = await sendMessage(conversationId, text)
    setSending(false)
    if (!res.ok) {
      // Roll back on failure.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setBody(text)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                {m.body}
                <span className={`mt-1 block text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            rows={1}
            placeholder="Write a message…"
            className="max-h-32 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="icon" className="size-11 shrink-0 rounded-full" disabled={sending || !body.trim()} onClick={submit} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Keep contact and payment on Estata until you’ve verified the property. Never send advances before viewing in person.
        </p>
      </div>
    </div>
  )
}
