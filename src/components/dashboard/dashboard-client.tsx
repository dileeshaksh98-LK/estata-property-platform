'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Eye, Heart, Inbox, Pencil, Plus, Settings, TrendingUp, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { deleteProperty, setListingStatus } from '@/lib/actions/properties'
import { useToast } from '@/components/providers/toast-provider'
import { EmailVerifyBanner } from '@/components/dashboard/email-verify-banner'
import { updateProfile } from '@/lib/actions/profile'
import { formatPrice, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Property } from '@/types/property'
import type { Lead } from '@/lib/db/inquiries.repo'
import type { Profile } from '@/lib/db/profiles.repo'
import type { SellerStats } from '@/lib/types/database'

const TABS = [
  { id: 'listings', label: 'Listings', icon: BarChart3 },
  { id: 'leads', label: 'Leads', icon: Inbox },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const
type TabId = (typeof TABS)[number]['id']

export function DashboardClient({
  stats, listings, leads, profile,
}: { stats: SellerStats; listings: Property[]; leads: Lead[]; profile: Profile | null }) {
  const [tab, setTab] = useState<TabId>('listings')

  const cards = [
    { label: 'Total views', value: stats.total_views.toLocaleString(), icon: Eye },
    { label: 'Saved by users', value: stats.total_saved.toLocaleString(), icon: Heart },
    { label: 'New leads', value: stats.total_leads.toLocaleString(), icon: Inbox },
    { label: 'Active listings', value: stats.active_listings.toLocaleString(), icon: BarChart3 },
  ]

  return (
    <div className="container pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Seller dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
        </div>
        <Button asChild><Link href="/dashboard/listings/new"><Plus className="-ml-1" /> Add listing</Link></Button>
      </div>

      <EmailVerifyBanner />

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="size-5" /></span>
            <p className="mt-4 font-display text-3xl font-semibold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 inline-flex rounded-2xl bg-secondary p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors', tab === t.id ? 'bg-card shadow-soft' : 'text-muted-foreground')}>
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'listings' && <ListingsTab listings={listings} />}
        {tab === 'leads' && <LeadsTab leads={leads} />}
        {tab === 'settings' && <SettingsTab profile={profile} />}
      </div>
    </div>
  )
}

function ListingsTab({ listings }: { listings: Property[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function markDone(id: string, status: 'sold' | 'rented') {
    setBusyId(id)
    startTransition(async () => {
      const res = await setListingStatus(id, status)
      setBusyId(null)
      if (res.ok) { toast({ title: `Marked as ${status}`, variant: 'success' }); router.refresh() }
      else toast({ title: 'Could not update status', description: res.error, variant: 'error' })
    })
  }

  function remove(id: string, title: string) {
    if (!confirm(`Delete “${title}”? This can’t be undone.`)) return
    setBusyId(id)
    startTransition(async () => {
      const res = await deleteProperty(id)
      setBusyId(null)
      if (res.ok) { toast({ title: 'Listing deleted', variant: 'success' }); router.refresh() }
      else toast({ title: 'Could not delete listing', description: res.error, variant: 'error' })
    })
  }

  if (!listings.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
        <p className="font-display text-lg font-semibold">No listings yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Post your first property to start reaching buyers.</p>
        <Button asChild className="mt-5"><Link href="/dashboard/listings/new"><Plus /> Add listing</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {listings.map((p) => {
        const cover = p.property_images?.find((i) => i.is_primary)?.url ?? p.property_images?.[0]?.url
        return (
          <div key={p.id} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-3 shadow-soft sm:p-4">
            <Link href={`/properties/${p.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-secondary">
              {cover && <Image src={cover} alt={p.title} fill sizes="80px" className="object-cover" />}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={p.status === 'active' ? 'verified' : 'outline'} className="capitalize">{p.status}</Badge>
                {p.is_featured && <Badge variant="featured">Featured</Badge>}
                <span className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
              </div>
              <p className="mt-1 line-clamp-1 font-medium">{p.title}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(p.price)} · {p.city ?? p.district}</p>
            </div>
            <div className="hidden items-center gap-5 px-4 text-sm text-muted-foreground sm:flex">
              <span className="flex items-center gap-1.5"><Eye className="size-4" /> {p.view_count.toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><Inbox className="size-4" /> {p.contact_count}</span>
            </div>
            <div className="flex items-center gap-1">
              {p.status === 'active' && (
                <Button
                  variant="outline" size="sm" className="hidden sm:inline-flex"
                  disabled={pending && busyId === p.id}
                  onClick={() => markDone(p.id, p.listing_type === 'rent' ? 'rented' : 'sold')}
                >
                  Mark {p.listing_type === 'rent' ? 'rented' : 'sold'}
                </Button>
              )}
              <Button variant="ghost" size="icon" aria-label="Edit listing" asChild><Link href={`/dashboard/listings/${p.id}/edit`}><Pencil className="size-4" /></Link></Button>
              <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive" disabled={pending && busyId === p.id} onClick={() => remove(p.id, p.title)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LeadsTab({ leads }: { leads: Lead[] }) {
  if (!leads.length) {
    return <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">No leads yet. They’ll appear here when buyers contact you.</div>
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      {leads.map((l, i) => (
        <div key={l.id} className={cn('flex items-start gap-4 p-4', i > 0 && 'border-t border-border')}>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-display font-semibold text-primary">{l.name.charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2">
              <p className="font-medium">{l.name}</p>
              {l.phone && <a href={`tel:${l.phone}`} className="text-sm text-primary hover:underline">{l.phone}</a>}
              {l.email && <a href={`mailto:${l.email}`} className="text-sm text-muted-foreground hover:underline">{l.email}</a>}
            </div>
            <p className="text-sm text-muted-foreground">Re: {l.property?.title ?? 'a listing'}</p>
            <p className="mt-1 line-clamp-2 text-sm">{l.message}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(l.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

function SettingsTab({ profile }: { profile: Profile | null }) {
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function save(formData: FormData) {
    setError(null); setSaved(false)
    startTransition(async () => {
      const res = await updateProfile({
        full_name: String(formData.get('full_name') || ''),
        phone: String(formData.get('phone') || ''),
        whatsapp: String(formData.get('whatsapp') || ''),
        bio: String(formData.get('bio') || ''),
      })
      if (res.ok) { setSaved(true); toast({ title: 'Profile updated', variant: 'success' }); setTimeout(() => setSaved(false), 2500) }
      else { setError(res.error); toast({ title: 'Could not save profile', description: res.error, variant: 'error' }) }
    })
  }

  return (
    <form action={save} className="max-w-xl space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-primary/10 font-display text-2xl font-semibold text-primary">
          {(profile?.full_name ?? 'S').charAt(0)}
        </span>
        <div className="space-y-1">
          {profile?.full_name && <p className="font-display text-lg font-semibold leading-none">{profile.full_name}</p>}
          <Badge variant={profile?.verification_level && profile.verification_level !== 'none' ? 'verified' : 'outline'} className="capitalize">
            {!profile?.verification_level || profile.verification_level === 'none' ? 'Unverified seller' : `${profile.verification_level} verified`}
          </Badge>
        </div>
      </div>
      <Field label="Full name"><Input name="full_name" defaultValue={profile?.full_name ?? ''} required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone"><Input name="phone" defaultValue={profile?.phone ?? ''} /></Field>
        <Field label="WhatsApp"><Input name="whatsapp" defaultValue={profile?.whatsapp ?? ''} /></Field>
      </div>
      <Field label="Bio">
        <textarea name="bio" defaultValue={profile?.bio ?? ''} rows={3} className="w-full rounded-xl border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </Field>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && <span className="text-sm text-primary">Saved ✓</span>}
        <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>
}
