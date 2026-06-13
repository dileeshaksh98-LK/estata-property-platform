import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getConversation } from '@/lib/db/messages.repo'
import { ChatThread } from '@/components/messages/chat-thread'
import { formatPriceFull } from '@/lib/format'

export const metadata: Metadata = { title: 'Conversation', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=/dashboard/messages/${id}`)

  const { conversation, messages } = await getConversation(id)
  if (!conversation) notFound()

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-0 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card p-3 sm:rounded-t-2xl">
        <Link href="/dashboard/messages" className="grid size-9 place-items-center rounded-full hover:bg-secondary" aria-label="Back">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.other?.full_name ?? 'Estata user'}</p>
          {conversation.property && (
            <Link href={`/properties/${conversation.property.slug}`} className="truncate text-xs text-muted-foreground hover:text-foreground">
              {conversation.property.title} · {formatPriceFull(conversation.property.price)}
            </Link>
          )}
        </div>
        {conversation.property?.cover_url && (
          <Link href={`/properties/${conversation.property.slug}`} className="size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={conversation.property.cover_url} alt="" className="size-full object-cover" />
          </Link>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-hidden border-x border-border bg-background sm:border-b sm:rounded-b-2xl">
        <ChatThread conversationId={conversation.id} currentUserId={user.id} initialMessages={messages} />
      </div>
    </div>
  )
}
