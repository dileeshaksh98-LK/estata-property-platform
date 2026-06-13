import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInbox } from '@/lib/db/messages.repo'
import { formatPriceFull } from '@/lib/format'

export const metadata: Metadata = { title: 'Messages', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/dashboard/messages')

  const inbox = await getInbox()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Messages</h1>

      {inbox.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          No conversations yet. When a buyer messages you about a listing — or you message a seller — it’ll appear here.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {inbox.map((c) => (
            <li key={c.id}>
              <Link href={`/dashboard/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-secondary/50">
                <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  {c.property?.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.property.cover_url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.other?.full_name ?? 'Estata user'}</p>
                    {c.last_message && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(c.last_message.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.property?.title ?? 'Listing'} · {c.property ? formatPriceFull(c.property.price) : ''}</p>
                  {c.last_message && <p className="mt-0.5 truncate text-sm text-muted-foreground">{c.last_message.body}</p>}
                </div>
                {c.unread > 0 && (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{c.unread}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
