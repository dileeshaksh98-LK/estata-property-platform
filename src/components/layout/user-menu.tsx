'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Heart, LayoutDashboard, LogOut, User } from 'lucide-react'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!supabaseEnabled) { setReady(true); return }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => { setEmail(data.user?.email ?? null); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!ready) return <div className="size-9 animate-pulse rounded-full bg-secondary" />

  if (!email) {
    return (
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/auth/login">Sign in</Link>
      </Button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Account menu" className="grid size-9 place-items-center rounded-full bg-primary/10 font-display font-semibold text-primary">
        {email.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">{email}</p>
          </div>
          <MenuLink href="/dashboard" icon={LayoutDashboard}>Dashboard</MenuLink>
          <MenuLink href="/saved" icon={Heart}>Saved</MenuLink>
          <MenuLink href="/dashboard" icon={User}>Profile</MenuLink>
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive hover:bg-secondary">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary">
      <Icon className="size-4 text-muted-foreground" /> {children}
    </Link>
  )
}
